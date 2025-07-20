import { 
  CreateEmissionDataDTO, 
  UpdateEmissionDataDTO, 
  EmissionDataQueryDTO,
  EmissionDataResponseDTO,
  EmissionStatisticsResponseDTO,
  EmissionDataListResponseDTO,
  VehicleEmissionDataResponseDTO,
  CreateEmissionDataResponseDTO,
  EmissionThresholds,
  EmissionDataWithAnalysisDTO
} from '../types/dtos/EmissionDataDto.js';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes.js';
import EmissionDataRepository from '../repositories/EmissionDataRepository.js';
import VehicleRepository from '../repositories/VehicleRepository.js';
import {TrackingDeviceRepository} from '../repositories/TrackingDeviceRepository.js';
import { AlertRepository } from '../repositories/AlertRepository.js';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler.js';
import logger from '../utils/logger.js';

// Emission thresholds - These need to be confirmed with Emmanuel
const EMISSION_THRESHOLDS: EmissionThresholds = {
  co2: { warning: 0.5, critical: 1.0 }, // CO2 percentage
  co: { warning: 0.3, critical: 0.5 },  // CO percentage  
  hc: { warning: 200, critical: 400 },   // HC in PPM
  nox: { warning: 100, critical: 200 },  // NOx in PPM
  pm25: { warning: 25, critical: 50 },   // PM2.5 in μg/m³
};

interface AlertData {
  type: string;
  title: string;
  message: string;
  triggerValue: string;
  triggerThreshold: string;
  vehicleId: number;
}

export class EmissionDataService {
  
  // Helper function to analyze emission levels and generate alerts
  private static async analyzeEmissionLevels(
    emissionData: any, 
    vehicleId: number, 
    plateNumber: string
  ): Promise<AlertData[]> {
    try {
      const alerts: AlertData[] = [];
      
      // Check CO2 levels
      if (emissionData.co2Percentage >= EMISSION_THRESHOLDS.co2.critical) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'Critical CO2 Emission Level',
          message: `Vehicle ${plateNumber} has critically high CO2 emissions (${emissionData.co2Percentage}%)`,
          triggerValue: `${emissionData.co2Percentage}%`,
          triggerThreshold: `CO2 > ${EMISSION_THRESHOLDS.co2.critical}%`,
          vehicleId,
        });
      } else if (emissionData.co2Percentage >= EMISSION_THRESHOLDS.co2.warning) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'High CO2 Emission Level',
          message: `Vehicle ${plateNumber} has high CO2 emissions (${emissionData.co2Percentage}%)`,
          triggerValue: `${emissionData.co2Percentage}%`,
          triggerThreshold: `CO2 > ${EMISSION_THRESHOLDS.co2.warning}%`,
          vehicleId,
        });
      }

      // Check CO levels
      if (emissionData.coPercentage >= EMISSION_THRESHOLDS.co.critical) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'Critical CO Emission Level',
          message: `Vehicle ${plateNumber} has critically high CO emissions (${emissionData.coPercentage}%)`,
          triggerValue: `${emissionData.coPercentage}%`,
          triggerThreshold: `CO > ${EMISSION_THRESHOLDS.co.critical}%`,
          vehicleId,
        });
      }

      // Check HC levels
      if (emissionData.hcPPM >= EMISSION_THRESHOLDS.hc.critical) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'Critical HC Emission Level',
          message: `Vehicle ${plateNumber} has critically high HC emissions (${emissionData.hcPPM} PPM)`,
          triggerValue: `${emissionData.hcPPM} PPM`,
          triggerThreshold: `HC > ${EMISSION_THRESHOLDS.hc.critical} PPM`,
          vehicleId,
        });
      }

      // Check NOx levels
      if (emissionData.noxPPM && emissionData.noxPPM >= EMISSION_THRESHOLDS.nox.critical) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'Critical NOx Emission Level',
          message: `Vehicle ${plateNumber} has critically high NOx emissions (${emissionData.noxPPM} PPM)`,
          triggerValue: `${emissionData.noxPPM} PPM`,
          triggerThreshold: `NOx > ${EMISSION_THRESHOLDS.nox.critical} PPM`,
          vehicleId,
        });
      }

      // Check PM2.5 levels
      if (emissionData.pm25Level && emissionData.pm25Level >= EMISSION_THRESHOLDS.pm25.critical) {
        alerts.push({
          type: 'HIGH_EMISSION_ALERT',
          title: 'Critical PM2.5 Level',
          message: `Vehicle ${plateNumber} has critically high PM2.5 levels (${emissionData.pm25Level} μg/m³)`,
          triggerValue: `${emissionData.pm25Level} μg/m³`,
          triggerThreshold: `PM2.5 > ${EMISSION_THRESHOLDS.pm25.critical} μg/m³`,
          vehicleId,
        });
      }

      return alerts;
    } catch (error) {
      logger.error('EmissionDataService::analyzeEmissionLevels failed', error);
      throw error;
    }
  }

  // Helper function to update vehicle emission status
  private static async updateVehicleEmissionStatus(vehicleId: number, emissionData: any): Promise<string> {
    try {
      const exceedsThresholds = 
        emissionData.co2Percentage >= EMISSION_THRESHOLDS.co2.warning ||
        emissionData.coPercentage >= EMISSION_THRESHOLDS.co.warning ||
        emissionData.hcPPM >= EMISSION_THRESHOLDS.hc.warning ||
        (emissionData.noxPPM && emissionData.noxPPM >= EMISSION_THRESHOLDS.nox.warning) ||
        (emissionData.pm25Level && emissionData.pm25Level >= EMISSION_THRESHOLDS.pm25.warning);

      const newStatus = exceedsThresholds ? 'TOP_POLLUTING' : 'NORMAL_EMISSION';

      // Update vehicle status
      await VehicleRepository.updateVehicle(vehicleId, { status: newStatus });

      return newStatus;
    } catch (error) {
      logger.error('EmissionDataService::updateVehicleEmissionStatus failed', error);
      throw error;
    }
  }

  // Helper function to classify emission level
  private static classifyEmissionLevel(data: any): 'NORMAL' | 'HIGH' | 'CRITICAL' {
    const isCritical = 
      data.co2Percentage >= EMISSION_THRESHOLDS.co2.critical ||
      data.coPercentage >= EMISSION_THRESHOLDS.co.critical ||
      data.hcPPM >= EMISSION_THRESHOLDS.hc.critical ||
      (data.noxPPM && data.noxPPM >= EMISSION_THRESHOLDS.nox.critical) ||
      (data.pm25Level && data.pm25Level >= EMISSION_THRESHOLDS.pm25.critical);

    const isHigh = 
      data.co2Percentage >= EMISSION_THRESHOLDS.co2.warning ||
      data.coPercentage >= EMISSION_THRESHOLDS.co.warning ||
      data.hcPPM >= EMISSION_THRESHOLDS.hc.warning ||
      (data.noxPPM && data.noxPPM >= EMISSION_THRESHOLDS.nox.warning) ||
      (data.pm25Level && data.pm25Level >= EMISSION_THRESHOLDS.pm25.warning);

    if (isCritical) return 'CRITICAL';
    if (isHigh) return 'HIGH';
    return 'NORMAL';
  }

  async createEmissionData(dto: CreateEmissionDataDTO): Promise<CreateEmissionDataResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['vehicleId', 'co2Percentage', 'coPercentage', 'o2Percentage', 'hcPPM', 'trackingDeviceId'];
      const missingFields = requiredFields.filter(field => 
        dto[field as keyof CreateEmissionDataDTO] === undefined || dto[field as keyof CreateEmissionDataDTO] === null
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate IDs
      if (isNaN(dto.vehicleId) || dto.vehicleId <= 0) {
        throw new AppError('Invalid vehicle ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      if (isNaN(dto.trackingDeviceId) || dto.trackingDeviceId <= 0) {
        throw new AppError('Invalid tracking device ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate emission values ranges
      const validations = [
        { field: 'co2Percentage', value: dto.co2Percentage, min: 0, max: 20 },
        { field: 'coPercentage', value: dto.coPercentage, min: 0, max: 10 },
        { field: 'o2Percentage', value: dto.o2Percentage, min: 0, max: 25 },
        { field: 'hcPPM', value: dto.hcPPM, min: 0, max: 10000 },
        { field: 'noxPPM', value: dto.noxPPM, min: 0, max: 5000 },
        { field: 'pm25Level', value: dto.pm25Level, min: 0, max: 500 }
      ];

      for (const validation of validations) {
        if (validation.value !== undefined && validation.value !== null) {
          if (isNaN(validation.value) || validation.value < validation.min || validation.value > validation.max) {
            throw new AppError(
              `${validation.field} must be a number between ${validation.min} and ${validation.max}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        }
      }

      // Verify vehicle and tracking device exist
      const [vehicle, device] = await Promise.all([
        VehicleRepository.getVehicleById(dto.vehicleId),
        TrackingDeviceRepository.getDeviceById(dto.trackingDeviceId)
      ]);

      if (!device) {
        throw new AppError('Tracking device not found', HttpStatusCode.NOT_FOUND);
      }

      // Create emission data
      const emissionData = await EmissionDataRepository.create({
        co2Percentage: dto.co2Percentage,
        coPercentage: dto.coPercentage,
        o2Percentage: dto.o2Percentage,
        hcPPM: dto.hcPPM,
        noxPPM: dto.noxPPM || null,
        pm25Level: dto.pm25Level || null,
        vehicleId: dto.vehicleId,
        plateNumber: dto.plateNumber || vehicle.plateNumber,
        trackingDeviceId: dto.trackingDeviceId,
        timestamp: dto.timestamp || new Date()
      });

      // Update tracking device status
      TrackingDeviceRepository.updateDevice(dto.trackingDeviceId, { lastPing: new Date() });

      // Analyze emission levels and generate alerts
      const alerts = await EmissionDataService.analyzeEmissionLevels(
        emissionData, 
        dto.vehicleId, 
        dto.plateNumber || vehicle.plateNumber
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

      // Update vehicle emission status
      const vehicleStatus = await EmissionDataService.updateVehicleEmissionStatus(dto.vehicleId, emissionData);

      logger.info('EmissionDataService::createEmissionData success', { 
        emissionDataId: emissionData.id,
        vehicleId: dto.vehicleId,
        alertsGenerated: alerts.length 
      });

      return {
        message: 'Emission data created successfully',
        data: emissionData,
        vehicleStatus,
        alertsGenerated: alerts.length,
        alerts: alerts.map(alert => ({
          type: alert.type,
          title: alert.title,
          severity: alert.title.includes('Critical') ? 'CRITICAL' : 'WARNING'
        }))
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('EmissionDataService::createEmissionData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::createEmissionData', appError);
      throw appError;
    }
  }

  async getAllEmissionData(params: PaginationParams & {
    startTime?: Date;
    endTime?: Date;
    vehicleStatus?: string;
    emissionLevel?: string;
    deviceCategory?: string;
  }): Promise<{ data: EmissionDataResponseDTO[]; meta: PaginationMeta }> {
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
        emissionLevel,
        deviceCategory
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

      // Validate emission level filter
      if (emissionLevel && !['NORMAL', 'HIGH', 'CRITICAL'].includes(emissionLevel)) {
        throw new AppError('Invalid emission level. Must be NORMAL, HIGH, or CRITICAL', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = [
        'id', 'timestamp', 'co2Percentage', 'coPercentage', 'o2Percentage', 
        'hcPPM', 'noxPPM', 'pm25Level', 'vehicleId', 'plateNumber', 'createdAt'
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

      if (vehicleStatus) {
        whereClause.vehicle = {
          status: vehicleStatus
        };
      }

      // Filter by emission level
      if (emissionLevel === 'HIGH') {
        whereClause.OR = [
          { co2Percentage: { gte: EMISSION_THRESHOLDS.co2.warning, lt:EMISSION_THRESHOLDS.co2.critical } },
          { coPercentage: { gte: EMISSION_THRESHOLDS.co.warning, lt:EMISSION_THRESHOLDS.co.critical } },
          { hcPPM: { gte: EMISSION_THRESHOLDS.hc.warning, lt:EMISSION_THRESHOLDS.hc.critical } },
          { noxPPM: { gte: EMISSION_THRESHOLDS.nox.warning, lt: EMISSION_THRESHOLDS.nox.critical  } },
          { pm25Level: { gte: EMISSION_THRESHOLDS.pm25.warning, lt: EMISSION_THRESHOLDS.pm25.critical  } }
        ];
      } else if (emissionLevel === 'CRITICAL') {
        whereClause.OR = [
          { co2Percentage: { gte: EMISSION_THRESHOLDS.co2.critical } },
          { coPercentage: { gte: EMISSION_THRESHOLDS.co.critical } },
          { hcPPM: { gte: EMISSION_THRESHOLDS.hc.critical } },
          { noxPPM: { gte: EMISSION_THRESHOLDS.nox.critical } },
          { pm25Level: { gte: EMISSION_THRESHOLDS.pm25.critical } }
        ];
      }
      else if (emissionLevel === 'NORMAL') {
        whereClause.AND = [
            { co2Percentage: { lt: EMISSION_THRESHOLDS.co2.warning } },
            { coPercentage: { lt: EMISSION_THRESHOLDS.co.warning } },
            { hcPPM: { lt: EMISSION_THRESHOLDS.hc.warning } },
            { OR: [
            { noxPPM: null },
            { noxPPM: { lt: EMISSION_THRESHOLDS.nox.warning } }
            ]},
            { OR: [
            { pm25Level: null },
            { pm25Level: { lt: EMISSION_THRESHOLDS.pm25.warning } }
            ]}
        ];
    }

      // Filter by device category
      if (deviceCategory) {
        whereClause.trackingDevice = {
          deviceCategory: deviceCategory
        };
      }

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add emission level classification to each record
      const enhancedData = result.data.map(data => {
        const emissionLevel = EmissionDataService.classifyEmissionLevel(data);
        
        return {
          ...data,
          emissionLevel,
          exceedsThresholds: {
            co2: data.co2Percentage >= EMISSION_THRESHOLDS.co2.warning,
            co: data.coPercentage >= EMISSION_THRESHOLDS.co.warning,
            hc: data.hcPPM >= EMISSION_THRESHOLDS.hc.warning,
            nox: data.noxPPM ? data.noxPPM >= EMISSION_THRESHOLDS.nox.warning : false,
            pm25: data.pm25Level ? data.pm25Level >= EMISSION_THRESHOLDS.pm25.warning : false,
          }
        };
      });

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('EmissionDataService::getAllEmissionData success', { 
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
        logger.error('EmissionDataService::getAllEmissionData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getAllEmissionData', appError);
      throw appError;
    }
  }

  async getEmissionDataById(id: number): Promise<EmissionDataWithAnalysisDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid emission data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const emissionData = await EmissionDataRepository.findByIdWithRelations(id);

      if (!emissionData) {
        throw new AppError('Emission data not found', HttpStatusCode.NOT_FOUND);
      }

      // Add emission level analysis
      const emissionLevel = EmissionDataService.classifyEmissionLevel(emissionData);

      const enhancedData: EmissionDataWithAnalysisDTO = {
        ...emissionData,
        emissionLevel,
        thresholdAnalysis: {
          co2: {
            value: emissionData.co2Percentage,
            exceedsWarning: emissionData.co2Percentage >= EMISSION_THRESHOLDS.co2.warning,
            exceedsCritical: emissionData.co2Percentage >= EMISSION_THRESHOLDS.co2.critical,
          },
          co: {
            value: emissionData.coPercentage,
            exceedsWarning: emissionData.coPercentage >= EMISSION_THRESHOLDS.co.warning,
            exceedsCritical: emissionData.coPercentage >= EMISSION_THRESHOLDS.co.critical,
          },
          hc: {
            value: emissionData.hcPPM,
            exceedsWarning: emissionData.hcPPM >= EMISSION_THRESHOLDS.hc.warning,
            exceedsCritical: emissionData.hcPPM >= EMISSION_THRESHOLDS.hc.critical,
          },
          nox: emissionData.noxPPM ? {
            value: emissionData.noxPPM,
            exceedsWarning: emissionData.noxPPM >= EMISSION_THRESHOLDS.nox.warning,
            exceedsCritical: emissionData.noxPPM >= EMISSION_THRESHOLDS.nox.critical,
          } : undefined,
          pm25: emissionData.pm25Level ? {
            value: emissionData.pm25Level,
            exceedsWarning: emissionData.pm25Level >= EMISSION_THRESHOLDS.pm25.warning,
            exceedsCritical: emissionData.pm25Level >= EMISSION_THRESHOLDS.pm25.critical,
          } : undefined,
        },
        thresholds: EMISSION_THRESHOLDS
      };

      logger.info('EmissionDataService::getEmissionDataById success', { id });
      return enhancedData;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('EmissionDataService::getEmissionDataById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getEmissionDataById', appError);
      throw appError;
    }
  }

  async getEmissionDataByVehicle(params: PaginationParams & {
    vehicleId: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: EmissionDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('EmissionDataService::getEmissionDataByVehicle success', { 
        vehicleId,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
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
        logger.error('EmissionDataService::getEmissionDataByVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getEmissionDataByVehicle', appError);
      throw appError;
    }
  }

  async getEmissionDataByVehicleInterval(params: PaginationParams & {
    vehicleId: number;
    interval: string;
    intervalValue: string;
  }): Promise<{ data: EmissionDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('EmissionDataService::getEmissionDataByVehicleInterval success', { 
        vehicleId,
        interval,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
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
        logger.error('EmissionDataService::getEmissionDataByVehicleInterval', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch emission data by interval',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getEmissionDataByVehicleInterval', appError);
      throw appError;
    }
  }

  async getEmissionDataByPlateNumber(params: PaginationParams & {
    plateNumber: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: EmissionDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('EmissionDataService::getEmissionDataByPlateNumber success', { 
        plateNumber,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
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
        logger.error('EmissionDataService::getEmissionDataByPlateNumber', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getEmissionDataByPlateNumber', appError);
      throw appError;
    }
  }

  async updateEmissionData(id: number, dto: UpdateEmissionDataDTO): Promise<EmissionDataResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid emission data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate emission values if they are being updated
      if (dto.co2Percentage !== undefined) {
        if (isNaN(dto.co2Percentage) || dto.co2Percentage < 0 || dto.co2Percentage > 20) {
          throw new AppError('CO2 percentage must be between 0 and 20', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.coPercentage !== undefined) {
        if (isNaN(dto.coPercentage) || dto.coPercentage < 0 || dto.coPercentage > 10) {
          throw new AppError('CO percentage must be between 0 and 10', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.o2Percentage !== undefined) {
        if (isNaN(dto.o2Percentage) || dto.o2Percentage < 0 || dto.o2Percentage > 25) {
          throw new AppError('O2 percentage must be between 0 and 25', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.hcPPM !== undefined) {
        if (isNaN(dto.hcPPM) || dto.hcPPM < 0 || dto.hcPPM > 10000) {
          throw new AppError('HC PPM must be between 0 and 10000', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.noxPPM !== undefined && dto.noxPPM !== null) {
        if (isNaN(dto.noxPPM) || dto.noxPPM < 0 || dto.noxPPM > 5000) {
          throw new AppError('NOx PPM must be between 0 and 5000', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.pm25Level !== undefined && dto.pm25Level !== null) {
        if (isNaN(dto.pm25Level) || dto.pm25Level < 0 || dto.pm25Level > 500) {
          throw new AppError('PM2.5 level must be between 0 and 500', HttpStatusCode.BAD_REQUEST);
        }
      }

      const existingRecord = await EmissionDataRepository.findByIdWithRelations(id);

      if (!existingRecord) {
        throw new AppError('Emission data not found', HttpStatusCode.NOT_FOUND);
      }

      const updatedEmissionData = await EmissionDataRepository.update(id, dto);

      // Re-analyze emission levels if emission values were updated
      const emissionFieldsUpdated = 
        dto.co2Percentage !== undefined || 
        dto.coPercentage !== undefined || 
        dto.hcPPM !== undefined || 
        dto.noxPPM !== undefined || 
        dto.pm25Level !== undefined;

      if (emissionFieldsUpdated && existingRecord.vehicleId) {
        await EmissionDataService.updateVehicleEmissionStatus(existingRecord.vehicleId, updatedEmissionData);
      }

      logger.info('EmissionDataService::updateEmissionData success', { id });
      return updatedEmissionData;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('EmissionDataService::updateEmissionData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::updateEmissionData', appError);
      throw appError;
    }
  }

  async deleteEmissionData(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid emission data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingRecord = await EmissionDataRepository.findById(id);

      if (!existingRecord) {
        throw new AppError('Emission data not found', HttpStatusCode.NOT_FOUND);
      }

      await EmissionDataRepository.delete(id);

      logger.info('EmissionDataService::deleteEmissionData success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('EmissionDataService::deleteEmissionData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::deleteEmissionData', appError);
      throw appError;
    }
  }

  async getEmissionStatistics(params: {
    vehicleId?: number;
    interval?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<EmissionStatisticsResponseDTO> {
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

      const emissionData = await EmissionDataRepository.findAllForStatistics(whereClause);

      if (emissionData.length === 0) {
        return {
          data: {
            averages: { co2: '0', co: '0', o2: '0', hc: '0', nox: null, pm25: null },
            totals: { records: 0, exceedsThresholds: 0, exceedsPercentage: '0' },
            thresholdAnalysis: { 
              normal: 0, high: 0, critical: 0, 
              normalPercentage: '0', highPercentage: '0', criticalPercentage: '0' 
            },
            thresholds: EMISSION_THRESHOLDS,
            timeRange: interval ? { interval } : {
              from: startTime || 'beginning',
              to: endTime || 'now'
            }
          }
        };
      }

      // Calculate enhanced statistics
      const stats = emissionData.reduce((acc, curr) => {
        const exceedsThreshold = 
          curr.co2Percentage >= EMISSION_THRESHOLDS.co2.warning ||
          curr.coPercentage >= EMISSION_THRESHOLDS.co.warning ||
          curr.hcPPM >= EMISSION_THRESHOLDS.hc.warning ||
          (curr.noxPPM && curr.noxPPM >= EMISSION_THRESHOLDS.nox.warning) ||
          (curr.pm25Level && curr.pm25Level >= EMISSION_THRESHOLDS.pm25.warning);

        const isCritical = 
          curr.co2Percentage >= EMISSION_THRESHOLDS.co2.critical ||
          curr.coPercentage >= EMISSION_THRESHOLDS.co.critical ||
          curr.hcPPM >= EMISSION_THRESHOLDS.hc.critical ||
          (curr.noxPPM && curr.noxPPM >= EMISSION_THRESHOLDS.nox.critical) ||
          (curr.pm25Level && curr.pm25Level >= EMISSION_THRESHOLDS.pm25.critical);

        return {
          co2Sum: acc.co2Sum + curr.co2Percentage,
          coSum: acc.coSum + curr.coPercentage,
          o2Sum: acc.o2Sum + curr.o2Percentage,
          hcSum: acc.hcSum + curr.hcPPM,
          noxSum: acc.noxSum + (curr.noxPPM || 0),
          noxCount: acc.noxCount + (curr.noxPPM ? 1 : 0),
          pm25Sum: acc.pm25Sum + (curr.pm25Level || 0),
          pm25Count: acc.pm25Count + (curr.pm25Level ? 1 : 0),
          count: acc.count + 1,
          exceedsThresholdCount: acc.exceedsThresholdCount + (exceedsThreshold ? 1 : 0),
          criticalCount: acc.criticalCount + (isCritical ? 1 : 0),
          highCount: acc.highCount + (exceedsThreshold && !isCritical ? 1 : 0),
        };
      }, { 
        co2Sum: 0, coSum: 0, o2Sum: 0, hcSum: 0, noxSum: 0, noxCount: 0, 
        pm25Sum: 0, pm25Count: 0, count: 0, exceedsThresholdCount: 0, 
        criticalCount: 0, highCount: 0 
      });

      const normalCount = stats.count - stats.exceedsThresholdCount;

      logger.info('EmissionDataService::getEmissionStatistics success', { 
        totalRecords: stats.count,
        exceedsThresholds: stats.exceedsThresholdCount 
      });

      return {
        data: {
          averages: {
            co2: (stats.co2Sum / stats.count).toFixed(3),
            co: (stats.coSum / stats.count).toFixed(3),
            o2: (stats.o2Sum / stats.count).toFixed(3),
            hc: (stats.hcSum / stats.count).toFixed(1),
            nox: stats.noxCount > 0 ? (stats.noxSum / stats.noxCount).toFixed(3) : null,
            pm25: stats.pm25Count > 0 ? (stats.pm25Sum / stats.pm25Count).toFixed(3) : null,
          },
          totals: {
            records: stats.count,
            exceedsThresholds: stats.exceedsThresholdCount,
            exceedsPercentage: ((stats.exceedsThresholdCount / stats.count) * 100).toFixed(1),
          },
          thresholdAnalysis: {
            normal: normalCount,
            high: stats.highCount,
            critical: stats.criticalCount,
            normalPercentage: ((normalCount / stats.count) * 100).toFixed(1),
            highPercentage: ((stats.highCount / stats.count) * 100).toFixed(1),
            criticalPercentage: ((stats.criticalCount / stats.count) * 100).toFixed(1),
          },
          thresholds: EMISSION_THRESHOLDS,
          timeRange: interval ? { interval } : {
            from: startTime || 'beginning',
            to: endTime || 'now'
          }
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('EmissionDataService::getEmissionStatistics', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to calculate emission statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataService::getEmissionStatistics', appError);
      throw appError;
    }
  }

  // Get emission thresholds
  getEmissionThresholds(): EmissionThresholds {
    return EMISSION_THRESHOLDS;
  }
}