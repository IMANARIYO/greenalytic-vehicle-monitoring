import { 
  CreateGpsDataDTO, 
  UpdateGpsDataDTO, 
  GpsDataQueryDTO,
  GpsDataResponseDTO,
  GpsStatisticsResponseDTO,
  GpsDataListResponseDTO,
  VehicleGpsDataResponseDTO,
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