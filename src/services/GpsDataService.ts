import { 
  CreateGpsDataDTO, 
  UpdateGpsDataDTO, 
  GpsDataResponseDTO,
  GpsStatisticsResponseDTO,
  CreateGpsDataResponseDTO,
  SpeedThresholds,
  GpsDataWithRouteAnalysisDTO,
  LocationRadiusResponseDTO,
  SpeedRangeResponseDTO
} from '../types/dtos/GpsDataDto';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes';
import GpsDataRepository from '../repositories/GpsDataRepository';
import VehicleRepository from '../repositories/VehicleRepository';
import {TrackingDeviceRepository} from '../repositories/TrackingDeviceRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler';
import logger from '../utils/logger';

// GPS speed thresholds - These need to be confirmed with Emmanuel
const SPEED_THRESHOLDS: SpeedThresholds = {
  speed: { warning: 100, critical: 120 }, // Speed in km/h
  accuracy: { minimum: 10 }, // Minimum accuracy in meters
  tracking: { interval: 30 } // Tracking interval in seconds
};

interface AlertData {
  type: string;
  title: string;
  message: string;
  triggerValue: string;
  triggerThreshold: string;
  vehicleId: number;
}

export class GpsDataService {
  
  // Helper function to calculate distance between two GPS points using Haversine formula
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  async getGpsDataByVehicleInterval(params: PaginationParams & {
    vehicleId: number;
    interval: string;
    intervalValue: string;
  }): Promise<{ data: GpsDataResponseDTO[]; meta: PaginationMeta }> {
    try {
      const { vehicleId, interval, intervalValue, page = 1, limit = 10 } = params;

      // Validate vehicle ID
      if (isNaN(vehicleId) || vehicleId <= 0) {
        throw new AppError('Invalid vehicle ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate interval parameters
      if (!interval || !intervalValue) {
        throw new AppError('Interval and interval value are required', HttpStatusCode.BAD_REQUEST);
      }

      // Validate interval type
      if (!['hours', 'days', 'daytime'].includes(interval)) {
        throw new AppError('Invalid interval. Must be hours, days, or daytime', HttpStatusCode.BAD_REQUEST);
      }

      // Validate value for hours and days
      if (interval !== 'daytime') {
        const numValue = parseInt(intervalValue);
        if (isNaN(numValue) || numValue <= 0) {
          throw new AppError('Interval value must be a positive integer for hours and days', HttpStatusCode.BAD_REQUEST);
        }
      }

      const whereClause: any = { vehicleId };
      const now = new Date();
      let startTime: Date, endTime: Date | undefined;

      switch (interval) {
        case 'hours':
          startTime = new Date(now);
          startTime.setHours(now.getHours() - parseInt(intervalValue));
          break;
        case 'days':
          startTime = new Date(now);
          startTime.setDate(now.getDate() - parseInt(intervalValue));
          break;
        case 'daytime':
          startTime = new Date(now);
          startTime.setHours(9, 0, 0, 0);
          endTime = new Date(now);
          endTime.setHours(17, 0, 0, 0);
          break;
        default:
          throw new AppError('Invalid interval. Use hours, days, or daytime', HttpStatusCode.BAD_REQUEST);
      }

      if (interval === 'daytime') {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else {
        whereClause.timestamp = { gte: startTime };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        speedLevel: GpsDataService.classifySpeedLevel(data.speed),
        exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: data.trackingDevice || undefined
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('GpsDataService::getGpsDataByVehicleInterval success', { 
        vehicleId,
        interval,
        totalCount: result.totalCount 
      });

      return {
        data: enhancedData,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataByVehicleInterval', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch GPS data by interval',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataByVehicleInterval', appError);
      throw appError;
    }
  }

  async getGpsDataByPlateNumber(params: PaginationParams & {
    plateNumber: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: GpsDataResponseDTO[]; meta: PaginationMeta }> {
    try {
      const { plateNumber, page = 1, limit = 10, startTime, endTime } = params;

      // Validate plate number
      if (!plateNumber || plateNumber.trim().length === 0) {
        throw new AppError('Plate number is required and cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const whereClause: any = { plateNumber: plateNumber.trim() };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        speedLevel: GpsDataService.classifySpeedLevel(data.speed),
        exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: data.trackingDevice || undefined
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('GpsDataService::getGpsDataByPlateNumber success', { 
        plateNumber,
        totalCount: result.totalCount 
      });

      return {
        data: enhancedData,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataByPlateNumber', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataByPlateNumber', appError);
      throw appError;
    }
  }

  async getGpsDataByLocationRadius(params: PaginationParams & {
    centerLatitude: number;
    centerLongitude: number;
    radiusKm: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<LocationRadiusResponseDTO> {
    try {
      const { centerLatitude, centerLongitude, radiusKm, page = 1, limit = 10, startTime, endTime } = params;

      // Validate coordinates
      if (!GpsDataService.validateGpsCoordinates(centerLatitude, centerLongitude)) {
        throw new AppError('Invalid center coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate radius
      if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 1000) {
        throw new AppError('Radius must be a number between 0 and 1000 km', HttpStatusCode.BAD_REQUEST);
      }

      // Calculate bounding box for initial filtering (approximate)
      const latDelta = radiusKm / 111; // Approximate km per degree of latitude
      const lonDelta = radiusKm / (111 * Math.cos(centerLatitude * Math.PI / 180)); // Adjust for longitude

      const whereClause: any = {
        latitude: {
          gte: centerLatitude - latDelta,
          lte: centerLatitude + latDelta
        },
        longitude: {
          gte: centerLongitude - lonDelta,
          lte: centerLongitude + lonDelta
        }
      };

      // Add time filtering
      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Filter by exact distance and add enhanced data
      const filteredData = result.data
        .map(data => {
          const distance = GpsDataService.calculateDistance(
            centerLatitude,
            centerLongitude,
            data.latitude,
            data.longitude
          );
          return {
            ...data,
            distance,
            speedLevel: GpsDataService.classifySpeedLevel(data.speed),
            exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
            trackingDevice: data.trackingDevice || undefined
          };
        })
        .filter(data => data.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by distance

      const totalFilteredCount = filteredData.length;
      const totalPages = Math.ceil(totalFilteredCount / limit);

      // Calculate search area
      const searchAreaKm2 = Math.PI * radiusKm * radiusKm;

      logger.info('GpsDataService::getGpsDataByLocationRadius success', { 
        centerLatitude,
        centerLongitude,
        radiusKm,
        totalCount: totalFilteredCount 
      });

      return {
        data: filteredData,
        meta: {
          page,
          limit,
          totalCount: totalFilteredCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          searchRadius: {
            centerLatitude,
            centerLongitude,
            radiusKm,
            searchAreaKm2: parseFloat(searchAreaKm2.toFixed(2))
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataByLocationRadius', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch GPS data by location radius',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataByLocationRadius', appError);
      throw appError;
    }
  }

  async getGpsDataBySpeedRange(params: PaginationParams & {
    minSpeed: number;
    maxSpeed: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<SpeedRangeResponseDTO> {
    try {
      const { minSpeed, maxSpeed, page = 1, limit = 10, startTime, endTime } = params;

      // Validate speed range
      if (isNaN(minSpeed) || minSpeed < 0) {
        throw new AppError('Minimum speed must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (isNaN(maxSpeed) || maxSpeed < 0) {
        throw new AppError('Maximum speed must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (minSpeed > maxSpeed) {
        throw new AppError('Minimum speed cannot be greater than maximum speed', HttpStatusCode.BAD_REQUEST);
      }

      const whereClause: any = {
        speed: {
          gte: minSpeed,
          lte: maxSpeed
        }
      };

      // Add time filtering
      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data and calculate statistics
      const enhancedData = result.data.map(data => ({
        ...data,
        speedLevel: GpsDataService.classifySpeedLevel(data.speed),
        exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: data.trackingDevice || undefined
      }));

      // Calculate speed statistics
      const totalSpeeds = result.data.reduce((sum, data) => sum + data.speed, 0);
      const averageSpeed = result.data.length > 0 ? totalSpeeds / result.data.length : 0;
      const violationsFound = result.data.filter(data => data.speed >= SPEED_THRESHOLDS.speed.warning).length;

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('GpsDataService::getGpsDataBySpeedRange success', { 
        minSpeed,
        maxSpeed,
        totalCount: result.totalCount,
        violationsFound 
      });

      return {
        data: enhancedData,
        meta: {
          page,
          limit,
          totalCount: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          speedRange: {
            minSpeed,
            maxSpeed,
            averageSpeed: parseFloat(averageSpeed.toFixed(2)),
            violationsFound
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataBySpeedRange', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch GPS data by speed range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataBySpeedRange', appError);
      throw appError;
    }
  }

  async updateGpsData(id: number, dto: UpdateGpsDataDTO): Promise<GpsDataResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid GPS data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate GPS coordinates if being updated
      if ((dto.latitude !== undefined || dto.longitude !== undefined)) {
        const lat = dto.latitude !== undefined ? dto.latitude : 0;
        const lon = dto.longitude !== undefined ? dto.longitude : 0;
        
        if (dto.latitude !== undefined && (isNaN(dto.latitude) || dto.latitude < -90 || dto.latitude > 90)) {
          throw new AppError('Latitude must be between -90 and 90', HttpStatusCode.BAD_REQUEST);
        }
        
        if (dto.longitude !== undefined && (isNaN(dto.longitude) || dto.longitude < -180 || dto.longitude > 180)) {
          throw new AppError('Longitude must be between -180 and 180', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Validate speed if being updated
      if (dto.speed !== undefined) {
        if (isNaN(dto.speed) || dto.speed < 0 || dto.speed > 500) {
          throw new AppError('Speed must be between 0 and 500 km/h', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Validate accuracy if being updated
      if (dto.accuracy !== undefined && dto.accuracy !== null) {
        if (isNaN(dto.accuracy) || dto.accuracy < 0 || dto.accuracy > 1000) {
          throw new AppError('Accuracy must be between 0 and 1000 meters', HttpStatusCode.BAD_REQUEST);
        }
      }

      const existingRecord = await GpsDataRepository.findByIdWithRelations(id);

      if (!existingRecord) {
        throw new AppError('GPS data not found', HttpStatusCode.NOT_FOUND);
      }

      const updatedGpsData = await GpsDataRepository.update(id, dto);

      // Re-analyze speed levels if speed was updated
      if (dto.speed !== undefined && existingRecord.vehicleId) {
        await GpsDataService.updateVehicleTrackingStatus(existingRecord.vehicleId, updatedGpsData);
      }

      // Add enhanced fields
      const enhancedData = {
        ...updatedGpsData,
        speedLevel: GpsDataService.classifySpeedLevel(updatedGpsData.speed),
        exceedsSpeedLimit: updatedGpsData.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: updatedGpsData.trackingDevice || undefined
      };

      logger.info('GpsDataService::updateGpsData success', { id });
      return enhancedData;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::updateGpsData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to update GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::updateGpsData', appError);
      throw appError;
    }
  }

  async deleteGpsData(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid GPS data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingRecord = await GpsDataRepository.findById(id);

      if (!existingRecord) {
        throw new AppError('GPS data not found', HttpStatusCode.NOT_FOUND);
      }

      await GpsDataRepository.delete(id);

      logger.info('GpsDataService::deleteGpsData success', { id });
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::deleteGpsData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to delete GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::deleteGpsData', appError);
      throw appError;
    }
  }

  async getGpsStatistics(params: {
    vehicleId?: number;
    interval?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<GpsStatisticsResponseDTO> {
    try {
      const { vehicleId, interval, startTime, endTime } = params;

      // Validate interval if provided
      if (interval && !['day', 'week', 'month'].includes(interval)) {
        throw new AppError('Invalid interval. Must be day, week, or month', HttpStatusCode.BAD_REQUEST);
      }

      // Validate vehicleId if provided
      if (vehicleId && (isNaN(vehicleId) || vehicleId <= 0)) {
        throw new AppError('Invalid vehicle ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      let whereClause: any = {};

      if (vehicleId) {
        whereClause.vehicleId = vehicleId;
      }

      // Handle date filtering
      let intervalStartTime: Date | undefined;
      if (interval) {
        const now = new Date();

        switch (interval) {
          case 'day':
            intervalStartTime = new Date(now);
            intervalStartTime.setDate(now.getDate() - 1);
            break;
          case 'week':
            intervalStartTime = new Date(now);
            intervalStartTime.setDate(now.getDate() - 7);
            break;
          case 'month':
            intervalStartTime = new Date(now);
            intervalStartTime.setMonth(now.getMonth() - 1);
            break;
        }

        if (intervalStartTime) {
          whereClause.timestamp = { gte: intervalStartTime };
        }
      } else if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const gpsData = await GpsDataRepository.findAllForStatistics(whereClause);

      if (gpsData.length === 0) {
        return {
          data: {
            summary: {
              totalRecords: 0,
              totalDistanceKm: 0,
              averageSpeed: '0',
              maxSpeed: 0,
              speedViolations: 0,
              speedViolationPercentage: '0'
            },
            speedAnalysis: {
              normal: 0, high: 0, critical: 0,
              normalPercentage: '0', highPercentage: '0', criticalPercentage: '0'
            },
            locationCoverage: {
              minLatitude: 0, maxLatitude: 0, minLongitude: 0, maxLongitude: 0,
              boundingBoxArea: 0
            },
            thresholds: SPEED_THRESHOLDS,
            timeRange: interval ? { interval } : {
              from: startTime || 'beginning',
              to: endTime || 'now'
            }
          }
        };
      }

      // Calculate comprehensive statistics
      let totalDistance = 0;
      let speedSum = 0;
      let maxSpeed = 0;
      let speedViolations = 0;
      let normalCount = 0, highCount = 0, criticalCount = 0;
      let minLat = gpsData[0].latitude, maxLat = gpsData[0].latitude;
      let minLon = gpsData[0].longitude, maxLon = gpsData[0].longitude;

      // Sort by timestamp for distance calculation
      const sortedData = gpsData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (let i = 0; i < sortedData.length; i++) {
        const current = sortedData[i];
        
        // Speed statistics
        speedSum += current.speed;
        maxSpeed = Math.max(maxSpeed, current.speed);
        
        if (current.speed >= SPEED_THRESHOLDS.speed.warning) {
          speedViolations++;
        }

        // Speed level classification
        const speedLevel = GpsDataService.classifySpeedLevel(current.speed);
        if (speedLevel === 'NORMAL') normalCount++;
        else if (speedLevel === 'HIGH') highCount++;
        else if (speedLevel === 'CRITICAL') criticalCount++;

        // Location coverage
        minLat = Math.min(minLat, current.latitude);
        maxLat = Math.max(maxLat, current.latitude);
        minLon = Math.min(minLon, current.longitude);
        maxLon = Math.max(maxLon, current.longitude);

        // Distance calculation
        if (i > 0) {
          const previous = sortedData[i - 1];
          const distance = GpsDataService.calculateDistance(
            previous.latitude, previous.longitude,
            current.latitude, current.longitude
          );
          totalDistance += distance;
        }
      }

      const averageSpeed = speedSum / gpsData.length;
      const speedViolationPercentage = (speedViolations / gpsData.length) * 100;

      // Calculate bounding box area (approximate)
      const latDiff = maxLat - minLat;
      const lonDiff = maxLon - minLon;
      const avgLat = (minLat + maxLat) / 2;
      const boundingBoxArea = latDiff * lonDiff * 111 * 111 * Math.cos(avgLat * Math.PI / 180);

      logger.info('GpsDataService::getGpsStatistics success', { 
        totalRecords: gpsData.length,
        speedViolations,
        totalDistance 
      });

      return {
        data: {
          summary: {
            totalRecords: gpsData.length,
            totalDistanceKm: parseFloat(totalDistance.toFixed(2)),
            averageSpeed: averageSpeed.toFixed(2),
            maxSpeed,
            speedViolations,
            speedViolationPercentage: speedViolationPercentage.toFixed(1)
          },
          speedAnalysis: {
            normal: normalCount,
            high: highCount,
            critical: criticalCount,
            normalPercentage: ((normalCount / gpsData.length) * 100).toFixed(1),
            highPercentage: ((highCount / gpsData.length) * 100).toFixed(1),
            criticalPercentage: ((criticalCount / gpsData.length) * 100).toFixed(1)
          },
          locationCoverage: {
            minLatitude: parseFloat(minLat.toFixed(6)),
            maxLatitude: parseFloat(maxLat.toFixed(6)),
            minLongitude: parseFloat(minLon.toFixed(6)),
            maxLongitude: parseFloat(maxLon.toFixed(6)),
            boundingBoxArea: parseFloat(boundingBoxArea.toFixed(2))
          },
          thresholds: SPEED_THRESHOLDS,
          timeRange: interval ? { interval } : {
            from: startTime || 'beginning',
            to: endTime || 'now'
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsStatistics', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to calculate GPS statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsStatistics', appError);
      throw appError;
    }
  }

  // Helper function to calculate bearing between two GPS points
  private static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - 
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360 degrees
  }

  // Helper function to analyze speed levels and generate alerts
  private static async analyzeSpeedLevels(
    gpsData: any, 
    vehicleId: number, 
    plateNumber: string
  ): Promise<AlertData[]> {
    try {
      const alerts: AlertData[] = [];
      
      // Check speed levels
      if (gpsData.speed >= SPEED_THRESHOLDS.speed.critical) {
        alerts.push({
          type: 'SPEED_VIOLATION_ALERT',
          title: 'Critical Speed Violation',
          message: `Vehicle ${plateNumber} is traveling at critically high speed (${gpsData.speed} km/h)`,
          triggerValue: `${gpsData.speed} km/h`,
          triggerThreshold: `Speed > ${SPEED_THRESHOLDS.speed.critical} km/h`,
          vehicleId,
        });
      } else if (gpsData.speed >= SPEED_THRESHOLDS.speed.warning) {
        alerts.push({
          type: 'SPEED_VIOLATION_ALERT',
          title: 'High Speed Warning',
          message: `Vehicle ${plateNumber} is traveling at high speed (${gpsData.speed} km/h)`,
          triggerValue: `${gpsData.speed} km/h`,
          triggerThreshold: `Speed > ${SPEED_THRESHOLDS.speed.warning} km/h`,
          vehicleId,
        });
      }

      // Check GPS accuracy
      if (gpsData.accuracy && gpsData.accuracy > SPEED_THRESHOLDS.accuracy.minimum) {
        alerts.push({
          type: 'GPS_ACCURACY_ALERT',
          title: 'Poor GPS Accuracy',
          message: `Vehicle ${plateNumber} has poor GPS accuracy (${gpsData.accuracy}m)`,
          triggerValue: `${gpsData.accuracy}m`,
          triggerThreshold: `Accuracy > ${SPEED_THRESHOLDS.accuracy.minimum}m`,
          vehicleId,
        });
      }

      return alerts;
    } catch (error) {
      logger.error('GpsDataService::analyzeSpeedLevels failed', error);
      throw error;
    }
  }

  // Helper function to update vehicle tracking status
  private static async updateVehicleTrackingStatus(vehicleId: number, gpsData: any): Promise<string> {
    try {
      const exceedsSpeedLimit = gpsData.speed >= SPEED_THRESHOLDS.speed.warning;
      const isStationary = gpsData.speed < 5; // Consider stationary if speed < 5 km/h

      let newStatus = 'NORMAL';
      if (exceedsSpeedLimit) {
        newStatus = 'SPEEDING';
      } else if (isStationary) {
        newStatus = 'STATIONARY';
      } else {
        newStatus = 'MOVING';
      }

      // Update vehicle status
      await VehicleRepository.updateVehicle(vehicleId, { status: newStatus as any });

      return newStatus;
    } catch (error) {
      logger.error('GpsDataService::updateVehicleTrackingStatus failed', error);
      throw error;
    }
  }

  // Helper function to classify speed level
  private static classifySpeedLevel(speed: number): 'NORMAL' | 'HIGH' | 'CRITICAL' {
    if (speed >= SPEED_THRESHOLDS.speed.critical) return 'CRITICAL';
    if (speed >= SPEED_THRESHOLDS.speed.warning) return 'HIGH';
    return 'NORMAL';
  }

  // Helper function to validate GPS coordinates
  private static validateGpsCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  async createGpsData(dto: CreateGpsDataDTO): Promise<CreateGpsDataResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['vehicleId', 'latitude', 'longitude', 'speed', 'plateNumber'];
      const missingFields = requiredFields.filter(field => 
        dto[field as keyof CreateGpsDataDTO] === undefined || dto[field as keyof CreateGpsDataDTO] === null
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate vehicle ID
      if (isNaN(dto.vehicleId) || dto.vehicleId <= 0) {
        throw new AppError('Invalid vehicle ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate GPS coordinates
      if (!GpsDataService.validateGpsCoordinates(dto.latitude, dto.longitude)) {
        throw new AppError('Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate speed
      if (isNaN(dto.speed) || dto.speed < 0 || dto.speed > 500) {
        throw new AppError('Speed must be a number between 0 and 500 km/h', HttpStatusCode.BAD_REQUEST);
      }

      // Validate accuracy if provided
      if (dto.accuracy !== undefined && (isNaN(dto.accuracy) || dto.accuracy < 0 || dto.accuracy > 1000)) {
        throw new AppError('Accuracy must be a number between 0 and 1000 meters', HttpStatusCode.BAD_REQUEST);
      }

      // Validate tracking device ID if provided
      if (dto.trackingDeviceId && (isNaN(dto.trackingDeviceId) || dto.trackingDeviceId <= 0)) {
        throw new AppError('Invalid tracking device ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Verify vehicle exists
      const vehicle = await VehicleRepository.getVehicleById(dto.vehicleId);
      
      if (!vehicle) {
        throw new AppError('Vehicle not found', HttpStatusCode.NOT_FOUND);
      }

      // Verify tracking device exists if provided
      if (dto.trackingDeviceId) {
        const device = await TrackingDeviceRepository.getDeviceById(dto.trackingDeviceId);
        if (!device) {
          throw new AppError('Tracking device not found', HttpStatusCode.NOT_FOUND);
        }
      }

      // Get previous GPS data to calculate distance
      let distanceFromPrevious = 0;
      const previousGpsData = await GpsDataRepository.getLatestByVehicleId(dto.vehicleId);
      if (previousGpsData) {
        distanceFromPrevious = GpsDataService.calculateDistance(
          previousGpsData.latitude,
          previousGpsData.longitude,
          dto.latitude,
          dto.longitude
        );
      }

      // Create GPS data
      const gpsData = await GpsDataRepository.create({
        latitude: dto.latitude,
        longitude: dto.longitude,
        speed: dto.speed,
        accuracy: dto.accuracy,
        vehicleId: dto.vehicleId,
        plateNumber: dto.plateNumber,
        trackingDeviceId: dto.trackingDeviceId,
        trackingStatus: dto.trackingStatus !== undefined ? dto.trackingStatus : true,
        timestamp: dto.timestamp || new Date()
      });

      // Update tracking device status if provided
      if (dto.trackingDeviceId) {
        TrackingDeviceRepository.updateDevice(dto.trackingDeviceId, { lastPing: new Date() });
      }

      // Analyze speed levels and generate alerts
      const alerts = await GpsDataService.analyzeSpeedLevels(
        gpsData, 
        dto.vehicleId, 
        dto.plateNumber
      );
      
      // Create alerts in database
      if (alerts.length > 0) {
        const alertRepository = new AlertRepository();
        await alertRepository.createMany(
          alerts.map(alert => ({
            ...alert,
            userId: vehicle.user.id, // Assign to vehicle owner
          }))
        );
      }

      // Update vehicle tracking status
      const vehicleStatus = await GpsDataService.updateVehicleTrackingStatus(dto.vehicleId, gpsData);

      // Classify speed level
      const speedLevel = GpsDataService.classifySpeedLevel(dto.speed);
      const speedViolation = dto.speed >= SPEED_THRESHOLDS.speed.warning;

      logger.info('GpsDataService::createGpsData success', { 
        gpsDataId: gpsData.id,
        vehicleId: dto.vehicleId,
        alertsGenerated: alerts.length,
        speedViolation
      });

      return {
        message: 'GPS data created successfully',
        data: {
          ...gpsData,
          speedLevel,
          exceedsSpeedLimit: speedViolation,
          distanceFromPrevious,
          trackingDevice: gpsData.trackingDevice || undefined // Convert null to undefined
        },
        speedViolation,
        alertsGenerated: alerts.length,
        alerts: alerts.map(alert => ({
          type: alert.type,
          title: alert.title,
          severity: alert.title.includes('Critical') ? 'CRITICAL' : 'WARNING'
        })),
        location: {
          // These would be populated by reverse geocoding service if available
          address: undefined,
          city: undefined,
          country: undefined
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('GpsDataService::createGpsData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::createGpsData', appError);
      throw appError;
    }
  }

  async getAllGpsData(params: PaginationParams & {
    startTime?: Date;
    endTime?: Date;
    vehicleStatus?: string;
    speedLevel?: string;
    minSpeed?: number;
    maxSpeed?: number;
  }): Promise<{ data: GpsDataResponseDTO[]; meta: PaginationMeta }> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        startTime,
        endTime,
        vehicleStatus,
        speedLevel,
        minSpeed,
        maxSpeed
      } = params;

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortOrder
      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new AppError('Sort order must be either "asc" or "desc"', HttpStatusCode.BAD_REQUEST);
      }

      // Validate speed level filter
      if (speedLevel && !['NORMAL', 'HIGH', 'CRITICAL'].includes(speedLevel)) {
        throw new AppError('Invalid speed level. Must be NORMAL, HIGH, or CRITICAL', HttpStatusCode.BAD_REQUEST);
      }

      // Validate speed range
      if (minSpeed !== undefined && (isNaN(minSpeed) || minSpeed < 0)) {
        throw new AppError('Minimum speed must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (maxSpeed !== undefined && (isNaN(maxSpeed) || maxSpeed < 0)) {
        throw new AppError('Maximum speed must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (minSpeed !== undefined && maxSpeed !== undefined && minSpeed > maxSpeed) {
        throw new AppError('Minimum speed cannot be greater than maximum speed', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = [
        'id', 'timestamp', 'latitude', 'longitude', 'speed', 'accuracy', 
        'vehicleId', 'plateNumber', 'createdAt'
      ];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Build where clause for filtering
      const whereClause: any = {};

      // Date filtering
      if (startTime && endTime) {
        whereClause.timestamp = {
          gte: startTime,
          lte: endTime
        };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      // Vehicle status filtering
      if (vehicleStatus) {
        whereClause.vehicle = {
          status: vehicleStatus
        };
      }

      // Speed range filtering
      if (minSpeed !== undefined || maxSpeed !== undefined) {
        whereClause.speed = {};
        if (minSpeed !== undefined) whereClause.speed.gte = minSpeed;
        if (maxSpeed !== undefined) whereClause.speed.lte = maxSpeed;
      }

      // Filter by speed level
      if (speedLevel === 'HIGH') {
        whereClause.speed = {
          ...whereClause.speed,
          gte: SPEED_THRESHOLDS.speed.warning,
          lt: SPEED_THRESHOLDS.speed.critical
        };
      } else if (speedLevel === 'CRITICAL') {
        whereClause.speed = {
          ...whereClause.speed,
          gte: SPEED_THRESHOLDS.speed.critical
        };
      } else if (speedLevel === 'NORMAL') {
        whereClause.speed = {
          ...whereClause.speed,
          lt: SPEED_THRESHOLDS.speed.warning
        };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add speed level classification to each record
      const enhancedData = result.data.map(data => {
        const speedLevel = GpsDataService.classifySpeedLevel(data.speed);
        
        return {
          ...data,
          speedLevel,
          exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
          trackingDevice: data.trackingDevice || undefined // Convert null to undefined
        };
      });

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('GpsDataService::getAllGpsData success', { 
        totalCount: result.totalCount,
        page,
        limit 
      });

      return {
        data: enhancedData,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined,
          sortBy,
          sortOrder
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('GpsDataService::getAllGpsData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getAllGpsData', appError);
      throw appError;
    }
  }

  async getGpsDataById(id: number): Promise<GpsDataWithRouteAnalysisDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid GPS data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const gpsData = await GpsDataRepository.findByIdWithRelations(id);

      if (!gpsData) {
        throw new AppError('GPS data not found', HttpStatusCode.NOT_FOUND);
      }

      // Get previous and next GPS data for route analysis
      const [previousData, nextData] = await Promise.all([
        GpsDataRepository.getPreviousGpsData(gpsData.vehicleId, gpsData.timestamp),
        GpsDataRepository.getNextGpsData(gpsData.vehicleId, gpsData.timestamp)
      ]);

      // Calculate route analysis
      let routeAnalysis = {
        distanceFromStart: 0,
        timeFromStart: '0m',
        bearing: 0,
        speedChange: 0,
        isStationary: gpsData.speed < 5,
        estimatedAddress: undefined
      };

      if (previousData) {
        const distance = GpsDataService.calculateDistance(
          previousData.latitude,
          previousData.longitude,
          gpsData.latitude,
          gpsData.longitude
        );
        
        const bearing = GpsDataService.calculateBearing(
          previousData.latitude,
          previousData.longitude,
          gpsData.latitude,
          gpsData.longitude
        );

        const timeDiff = gpsData.timestamp.getTime() - previousData.timestamp.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        routeAnalysis = {
          distanceFromStart: distance,
          timeFromStart: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          bearing,
          speedChange: gpsData.speed - previousData.speed,
          isStationary: gpsData.speed < 5,
          estimatedAddress: undefined // Would be populated by reverse geocoding service
        };
      }

      // Add speed level analysis
      const speedLevel = GpsDataService.classifySpeedLevel(gpsData.speed);

      const enhancedData: GpsDataWithRouteAnalysisDTO = {
        ...gpsData,
        speedLevel,
        exceedsSpeedLimit: gpsData.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: gpsData.trackingDevice || undefined, // Convert null to undefined
        routeAnalysis,
        thresholds: SPEED_THRESHOLDS
      };

      logger.info('GpsDataService::getGpsDataById success', { id });
      return enhancedData;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataById', appError);
      throw appError;
    }
  }

  async getGpsDataByVehicle(params: PaginationParams & {
    vehicleId: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: GpsDataResponseDTO[]; meta: PaginationMeta }> {
    try {
      const { vehicleId, page = 1, limit = 10, startTime, endTime } = params;

      // Validate vehicle ID
      if (isNaN(vehicleId) || vehicleId <= 0) {
        throw new AppError('Invalid vehicle ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      const whereClause: any = { vehicleId };

      if (startTime && endTime) {
        whereClause.timestamp = {
          gte: startTime,
          lte: endTime
        };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const result = await GpsDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        speedLevel: GpsDataService.classifySpeedLevel(data.speed),
        exceedsSpeedLimit: data.speed >= SPEED_THRESHOLDS.speed.warning,
        trackingDevice: data.trackingDevice || undefined // Convert null to undefined
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('GpsDataService::getGpsDataByVehicle success', { 
        vehicleId,
        totalCount: result.totalCount 
      });

      return {
        data: enhancedData,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('GpsDataService::getGpsDataByVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataService::getGpsDataByVehicle', appError);
      throw appError;
    }
  }

  // Get speed thresholds
  getSpeedThresholds(): SpeedThresholds {
    return SPEED_THRESHOLDS;
  }
}

export default new GpsDataService();