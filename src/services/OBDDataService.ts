import { 
  CreateOBDDataDTO, 
  UpdateOBDDataDTO, 
  OBDDataQueryDTO,
  OBDDataResponseDTO,
  OBDStatisticsResponseDTO,
  OBDDataListResponseDTO,
  VehicleOBDDataResponseDTO,
  CreateOBDDataResponseDTO,
  OBDThresholds,
  OBDDataWithDiagnosticsDTO
} from '../types/dtos/OBDDataDto';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes';
import OBDDataRepository from '../repositories/OBDDataRepository';
import VehicleRepository from '../repositories/VehicleRepository';
import {TrackingDeviceRepository} from '../repositories/TrackingDeviceRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler';
import logger from '../utils/logger';

// OBD diagnostic thresholds - These need to be confirmed with Emmanuel
const OBD_THRESHOLDS: OBDThresholds = {
  rpm: { idle: 800, normal: 6000, high: 7000, critical: 8000 },
  engineTemperature: { normal: 90, high: 100, critical: 110 }, // °C
  throttlePosition: { closed: 5, partial: 50, full: 95 }, // %
  faultCodes: { maxActive: 0, warningLimit: 3, criticalLimit: 5 },
  performance: { excellent: 90, good: 70, fair: 50, poor: 30 } // score
};

interface AlertData {
  type: string;
  title: string;
  message: string;
  triggerValue: string;
  triggerThreshold: string;
  vehicleId: number;
}

export class OBDDataService {
  
  // Helper function to calculate engine performance score
  private static calculatePerformanceScore(obdData: any): number {
    let score = 100;
    
    // RPM efficiency (reduce score for extreme values)
    if (obdData.rpm) {
      if (obdData.rpm > OBD_THRESHOLDS.rpm.high) score -= 20;
      else if (obdData.rpm > OBD_THRESHOLDS.rpm.normal) score -= 10;
      else if (obdData.rpm < OBD_THRESHOLDS.rpm.idle) score -= 15;
    }
    
    // Engine temperature impact
    if (obdData.engineTemperature) {
      if (obdData.engineTemperature > OBD_THRESHOLDS.engineTemperature.critical) score -= 30;
      else if (obdData.engineTemperature > OBD_THRESHOLDS.engineTemperature.high) score -= 15;
    }
    
    // Fault codes impact
    const faultCount = obdData.faultCodes?.length || 0;
    if (faultCount > OBD_THRESHOLDS.faultCodes.criticalLimit) score -= 40;
    else if (faultCount > OBD_THRESHOLDS.faultCodes.warningLimit) score -= 20;
    else if (faultCount > OBD_THRESHOLDS.faultCodes.maxActive) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Helper function to analyze OBD data and generate alerts
  private static async analyzeOBDData(
    obdData: any, 
    vehicleId: number, 
    plateNumber: string
  ): Promise<AlertData[]> {
    try {
      const alerts: AlertData[] = [];
      
      // Check engine temperature
      if (obdData.engineTemperature >= OBD_THRESHOLDS.engineTemperature.critical) {
        alerts.push({
          type: 'DIAGNOSTIC_FAULT_NOTIFICATION',
          title: 'Critical Engine Temperature',
          message: `Vehicle ${plateNumber} has critically high engine temperature (${obdData.engineTemperature}°C)`,
          triggerValue: `${obdData.engineTemperature}°C`,
          triggerThreshold: `Temperature > ${OBD_THRESHOLDS.engineTemperature.critical}°C`,
          vehicleId,
        });
      } else if (obdData.engineTemperature >= OBD_THRESHOLDS.engineTemperature.high) {
        alerts.push({
          type: 'DIAGNOSTIC_FAULT_NOTIFICATION',
          title: 'High Engine Temperature',
          message: `Vehicle ${plateNumber} has high engine temperature (${obdData.engineTemperature}°C)`,
          triggerValue: `${obdData.engineTemperature}°C`,
          triggerThreshold: `Temperature > ${OBD_THRESHOLDS.engineTemperature.high}°C`,
          vehicleId,
        });
      }

      // Check RPM levels
      if (obdData.rpm >= OBD_THRESHOLDS.rpm.critical) {
        alerts.push({
          type: 'DIAGNOSTIC_FAULT_NOTIFICATION',
          title: 'Critical RPM Level',
          message: `Vehicle ${plateNumber} has critically high RPM (${obdData.rpm})`,
          triggerValue: `${obdData.rpm} RPM`,
          triggerThreshold: `RPM > ${OBD_THRESHOLDS.rpm.critical}`,
          vehicleId,
        });
      }

      // Check fault codes
      const faultCount = obdData.faultCodes?.length || 0;
      if (faultCount > OBD_THRESHOLDS.faultCodes.criticalLimit) {
        alerts.push({
          type: 'DIAGNOSTIC_FAULT_NOTIFICATION',
          title: 'Critical Fault Codes Detected',
          message: `Vehicle ${plateNumber} has ${faultCount} active fault codes`,
          triggerValue: `${faultCount} faults`,
          triggerThreshold: `Faults > ${OBD_THRESHOLDS.faultCodes.criticalLimit}`,
          vehicleId,
        });
      } else if (faultCount > OBD_THRESHOLDS.faultCodes.warningLimit) {
        alerts.push({
          type: 'DIAGNOSTIC_FAULT_NOTIFICATION',
          title: 'Multiple Fault Codes Detected',
          message: `Vehicle ${plateNumber} has ${faultCount} active fault codes`,
          triggerValue: `${faultCount} faults`,
          triggerThreshold: `Faults > ${OBD_THRESHOLDS.faultCodes.warningLimit}`,
          vehicleId,
        });
      }

      return alerts;
    } catch (error) {
      logger.error('OBDDataService::analyzeOBDData failed', error);
      throw error;
    }
  }

  // Helper function to update vehicle engine status
  private static async updateVehicleEngineStatus(vehicleId: number, obdData: any): Promise<string> {
    try {
      const faultCount = obdData.faultCodes?.length || 0;
      const highTemp = obdData.engineTemperature >= OBD_THRESHOLDS.engineTemperature.high;
      const criticalRPM = obdData.rpm >= OBD_THRESHOLDS.rpm.critical;

      let newStatus = 'NORMAL_EMISSION';
      if (faultCount > OBD_THRESHOLDS.faultCodes.criticalLimit || highTemp || criticalRPM) {
        newStatus = 'UNDER_MAINTENANCE';
      } else if (faultCount > OBD_THRESHOLDS.faultCodes.maxActive) {
        newStatus = 'TOP_POLLUTING'; // Engine issues may affect emissions
      }

      // Update vehicle status
      await VehicleRepository.updateVehicle(vehicleId, { status: newStatus as any });

      return newStatus;
    } catch (error) {
      logger.error('OBDDataService::updateVehicleEngineStatus failed', error);
      throw error;
    }
  }

  // Helper function to classify engine health
  private static classifyEngineHealth(obdData: any): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const faultCount = obdData.faultCodes?.length || 0;
    const highTemp = obdData.engineTemperature >= OBD_THRESHOLDS.engineTemperature.high;
    const criticalRPM = obdData.rpm >= OBD_THRESHOLDS.rpm.critical;

    if (faultCount > OBD_THRESHOLDS.faultCodes.criticalLimit || 
        obdData.engineTemperature >= OBD_THRESHOLDS.engineTemperature.critical ||
        criticalRPM) {
      return 'CRITICAL';
    }
    
    if (faultCount > OBD_THRESHOLDS.faultCodes.maxActive || highTemp) {
      return 'WARNING';
    }
    
    return 'HEALTHY';
  }

  // Helper function to classify temperature status
  private static classifyTemperatureStatus(temperature?: number): 'NORMAL' | 'HIGH' | 'OVERHEATING' {
    if (!temperature) return 'NORMAL';
    
    if (temperature >= OBD_THRESHOLDS.engineTemperature.critical) return 'OVERHEATING';
    if (temperature >= OBD_THRESHOLDS.engineTemperature.high) return 'HIGH';
    return 'NORMAL';
  }

  // Helper function to classify RPM status
  private static classifyRPMStatus(rpm?: number): 'IDLE' | 'NORMAL' | 'HIGH' | 'REDLINE' {
    if (!rpm) return 'IDLE';
    
    if (rpm >= OBD_THRESHOLDS.rpm.critical) return 'REDLINE';
    if (rpm >= OBD_THRESHOLDS.rpm.high) return 'HIGH';
    if (rpm >= OBD_THRESHOLDS.rpm.idle) return 'NORMAL';
    return 'IDLE';
  }

  // Helper function to classify throttle status
  private static classifyThrottleStatus(throttlePosition: number): 'CLOSED' | 'PARTIAL' | 'FULL' {
    if (throttlePosition >= OBD_THRESHOLDS.throttlePosition.full) return 'FULL';
    if (throttlePosition >= OBD_THRESHOLDS.throttlePosition.partial) return 'PARTIAL';
    return 'CLOSED';
  }

  async createOBDData(dto: CreateOBDDataDTO): Promise<CreateOBDDataResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['vehicleId', 'throttlePosition', 'plateNumber', 'trackingDeviceId'];
      const missingFields = requiredFields.filter(field => 
        dto[field as keyof CreateOBDDataDTO] === undefined || dto[field as keyof CreateOBDDataDTO] === null
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

      // Validate OBD values ranges
      const validations = [
        { field: 'rpm', value: dto.rpm, min: 0, max: 10000, optional: true },
        { field: 'throttlePosition', value: dto.throttlePosition, min: 0, max: 100, optional: false },
        { field: 'engineTemperature', value: dto.engineTemperature, min: -40, max: 200, optional: true }
      ];

      for (const validation of validations) {
        if (validation.value !== undefined && validation.value !== null) {
          if (isNaN(validation.value) || validation.value < validation.min || validation.value > validation.max) {
            throw new AppError(
              `${validation.field} must be a number between ${validation.min} and ${validation.max}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        } else if (!validation.optional) {
          throw new AppError(`${validation.field} is required`, HttpStatusCode.BAD_REQUEST);
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

      // Create OBD data
      const obdData = await OBDDataRepository.create({
        rpm: dto.rpm,
        throttlePosition: dto.throttlePosition,
        engineTemperature: dto.engineTemperature,
        engineStatus: dto.engineStatus,
        faultCodes: dto.faultCodes || [],
        vehicleId: dto.vehicleId,
        plateNumber: dto.plateNumber,
        trackingDeviceId: dto.trackingDeviceId,
        timestamp: dto.timestamp || new Date()
      });

      // Update tracking device status
      TrackingDeviceRepository.updateDevice(dto.trackingDeviceId, { lastPing: new Date() });

      // Analyze OBD data and generate alerts
      const alerts = await OBDDataService.analyzeOBDData(
        obdData, 
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

      // Update vehicle engine status
      const vehicleStatus = await OBDDataService.updateVehicleEngineStatus(dto.vehicleId, obdData);

      // Calculate enhanced fields
      const engineHealthStatus = OBDDataService.classifyEngineHealth(obdData);
      const temperatureStatus = OBDDataService.classifyTemperatureStatus(dto.engineTemperature);
      const rpmStatus = OBDDataService.classifyRPMStatus(dto.rpm);
      const throttleStatus = OBDDataService.classifyThrottleStatus(dto.throttlePosition);
      const performanceScore = OBDDataService.calculatePerformanceScore(obdData);
      const faultCodesCount = dto.faultCodes?.length || 0;
      const engineAlert = engineHealthStatus !== 'HEALTHY';
      const faultCodesDetected = faultCodesCount > 0;

      // Generate diagnostics
      const diagnostics = {
        engineHealthScore: performanceScore,
        maintenanceRecommended: engineHealthStatus === 'CRITICAL' || faultCodesCount > OBD_THRESHOLDS.faultCodes.warningLimit,
        criticalFaults: faultCodesDetected ? dto.faultCodes.slice(0, 3) : [], // Show first 3 critical faults
        performanceTips: [] as string[]
      };

      if (dto.engineTemperature && dto.engineTemperature > OBD_THRESHOLDS.engineTemperature.normal) {
        diagnostics.performanceTips.push('Monitor engine cooling system');
      }
      if (dto.rpm && dto.rpm > OBD_THRESHOLDS.rpm.normal) {
        diagnostics.performanceTips.push('Avoid excessive RPM levels');
      }
      if (faultCodesCount > 0) {
        diagnostics.performanceTips.push('Schedule diagnostic check for fault codes');
      }

      logger.info('OBDDataService::createOBDData success', { 
        obdDataId: obdData.id,
        vehicleId: dto.vehicleId,
        alertsGenerated: alerts.length,
        engineAlert,
        faultCodesDetected
      });

      return {
        message: 'OBD data created successfully',
        data: {
          ...obdData,
          engineHealthStatus,
          temperatureStatus,
          rpmStatus,
          throttleStatus,
          faultCodesCount,
          hasActiveFaults: faultCodesDetected,
          performanceScore
        },
        engineAlert,
        faultCodesDetected,
        alertsGenerated: alerts.length,
        alerts: alerts.map(alert => ({
          type: alert.type,
          title: alert.title,
          severity: alert.title.includes('Critical') ? 'CRITICAL' : 'WARNING'
        })),
        diagnostics
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('OBDDataService::createOBDData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::createOBDData', appError);
      throw appError;
    }
  }

  async getAllOBDData(params: PaginationParams & {
    startTime?: Date;
    endTime?: Date;
    vehicleStatus?: string;
    engineStatus?: string;
    hasFaultCodes?: boolean;
    minRPM?: number;
    maxRPM?: number;
    minEngineTemp?: number;
    maxEngineTemp?: number;
    minThrottlePosition?: number;
    maxThrottlePosition?: number;
  }): Promise<{ data: OBDDataResponseDTO[]; meta: PaginationMeta }> {
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
        engineStatus,
        hasFaultCodes,
        minRPM,
        maxRPM,
        minEngineTemp,
        maxEngineTemp,
        minThrottlePosition,
        maxThrottlePosition
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

      // Validate numeric ranges
      if (minRPM !== undefined && (isNaN(minRPM) || minRPM < 0)) {
        throw new AppError('Minimum RPM must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (maxRPM !== undefined && (isNaN(maxRPM) || maxRPM < 0)) {
        throw new AppError('Maximum RPM must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (minRPM !== undefined && maxRPM !== undefined && minRPM > maxRPM) {
        throw new AppError('Minimum RPM cannot be greater than maximum RPM', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = [
        'id', 'timestamp', 'rpm', 'throttlePosition', 'engineTemperature', 
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

      // Engine status filtering
      if (engineStatus) {
        whereClause.engineStatus = engineStatus;
      }

      // Fault codes filtering
      if (hasFaultCodes !== undefined) {
        if (hasFaultCodes) {
          whereClause.faultCodes = { isEmpty: false };
        } else {
          whereClause.faultCodes = { isEmpty: true };
        }
      }

      // RPM range filtering
      if (minRPM !== undefined || maxRPM !== undefined) {
        whereClause.rpm = {};
        if (minRPM !== undefined) whereClause.rpm.gte = minRPM;
        if (maxRPM !== undefined) whereClause.rpm.lte = maxRPM;
      }

      // Engine temperature range filtering
      if (minEngineTemp !== undefined || maxEngineTemp !== undefined) {
        whereClause.engineTemperature = {};
        if (minEngineTemp !== undefined) whereClause.engineTemperature.gte = minEngineTemp;
        if (maxEngineTemp !== undefined) whereClause.engineTemperature.lte = maxEngineTemp;
      }

      // Throttle position range filtering
      if (minThrottlePosition !== undefined || maxThrottlePosition !== undefined) {
        whereClause.throttlePosition = {};
        if (minThrottlePosition !== undefined) whereClause.throttlePosition.gte = minThrottlePosition;
        if (maxThrottlePosition !== undefined) whereClause.throttlePosition.lte = maxThrottlePosition;
      }

      const result = await OBDDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data to each record
      const enhancedData = result.data.map(data => {
        const engineHealthStatus = OBDDataService.classifyEngineHealth(data);
        const temperatureStatus = OBDDataService.classifyTemperatureStatus(data.engineTemperature ?? undefined);
        const rpmStatus = OBDDataService.classifyRPMStatus(data.rpm ?? undefined);
        const throttleStatus = OBDDataService.classifyThrottleStatus(data.throttlePosition);
        const performanceScore = OBDDataService.calculatePerformanceScore(data);
        
        return {
          ...data,
          engineHealthStatus,
          temperatureStatus,
          rpmStatus,
          throttleStatus,
          faultCodesCount: data.faultCodes?.length || 0,
          hasActiveFaults: (data.faultCodes?.length || 0) > 0,
          performanceScore
        };
      });

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('OBDDataService::getAllOBDData success', { 
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
        logger.error('OBDDataService::getAllOBDData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getAllOBDData', appError);
      throw appError;
    }
  }

  async getOBDDataById(id: number): Promise<OBDDataWithDiagnosticsDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid OBD data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const obdData = await OBDDataRepository.findByIdWithRelations(id);

      if (!obdData) {
        throw new AppError('OBD data not found', HttpStatusCode.NOT_FOUND);
      }

      // Calculate diagnostic analysis
      const performanceScore = OBDDataService.calculatePerformanceScore(obdData);
      const engineHealthStatus = OBDDataService.classifyEngineHealth(obdData);
      
      let healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'FAIR';
      if (performanceScore >= OBD_THRESHOLDS.performance.excellent) healthStatus = 'EXCELLENT';
      else if (performanceScore >= OBD_THRESHOLDS.performance.good) healthStatus = 'GOOD';
      else if (performanceScore >= OBD_THRESHOLDS.performance.fair) healthStatus = 'FAIR';
      else healthStatus = 'POOR';

      const issues = [];
      const recommendations = [];

      if (obdData.engineTemperature && obdData.engineTemperature > OBD_THRESHOLDS.engineTemperature.high) {
        issues.push('High engine temperature detected');
        recommendations.push('Check cooling system and coolant levels');
      }

      if (obdData.rpm && obdData.rpm > OBD_THRESHOLDS.rpm.high) {
        issues.push('Excessive RPM detected');
        recommendations.push('Avoid over-revving the engine');
      }

      if (obdData.faultCodes?.length > 0) {
        issues.push(`${obdData.faultCodes.length} active fault codes`);
        recommendations.push('Schedule diagnostic scan and repair');
      }

      const enhancedData: OBDDataWithDiagnosticsDTO = {
        ...obdData,
        engineHealthStatus,
        temperatureStatus: OBDDataService.classifyTemperatureStatus(obdData.engineTemperature ?? undefined),
        rpmStatus: OBDDataService.classifyRPMStatus(obdData.rpm ?? undefined),
        throttleStatus: OBDDataService.classifyThrottleStatus(obdData.throttlePosition),
        faultCodesCount: obdData.faultCodes?.length || 0,
        hasActiveFaults: (obdData.faultCodes?.length || 0) > 0,
        performanceScore,
        diagnosticAnalysis: {
          engineHealth: {
            score: performanceScore,
            status: healthStatus,
            issues,
            recommendations
          },
          performanceMetrics: {
            rpmEfficiency: obdData.rpm ? Math.max(0, 100 - (obdData.rpm / OBD_THRESHOLDS.rpm.normal) * 100) : 100,
            throttleResponse: 100 - Math.abs(obdData.throttlePosition - 50), // Optimal around 50%
            temperatureStability: obdData.engineTemperature ? Math.max(0, 100 - ((obdData.engineTemperature - 80) / 30) * 100) : 100,
            overallPerformance: performanceScore
          },
          faultCodeDetails: {}, // Would be populated with actual fault code descriptions
          maintenancePrediction: {
            nextServiceDue: null, // Would calculate based on performance trends
            urgency: engineHealthStatus === 'CRITICAL' ? 'CRITICAL' : 
                    engineHealthStatus === 'WARNING' ? 'HIGH' : 'LOW',
            predictedIssues: issues
          }
        },
        thresholds: OBD_THRESHOLDS
      };

      logger.info('OBDDataService::getOBDDataById success', { id });
      return enhancedData;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('OBDDataService::getOBDDataById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getOBDDataById', appError);
      throw appError;
    }
  }

  async getOBDDataByVehicle(params: PaginationParams & {
    vehicleId: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: OBDDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await OBDDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        engineHealthStatus: OBDDataService.classifyEngineHealth(data),
        temperatureStatus: OBDDataService.classifyTemperatureStatus(data.engineTemperature ?? undefined),
        rpmStatus: OBDDataService.classifyRPMStatus(data.rpm ?? undefined),
        throttleStatus: OBDDataService.classifyThrottleStatus(data.throttlePosition),
        faultCodesCount: data.faultCodes?.length || 0,
        hasActiveFaults: (data.faultCodes?.length || 0) > 0,
        performanceScore: OBDDataService.calculatePerformanceScore(data)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('OBDDataService::getOBDDataByVehicle success', { 
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
        logger.error('OBDDataService::getOBDDataByVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getOBDDataByVehicle', appError);
      throw appError;
    }
  }

  async getOBDDataByVehicleInterval(params: PaginationParams & {
    vehicleId: number;
    interval: string;
    intervalValue: string;
  }): Promise<{ data: OBDDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await OBDDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        engineHealthStatus: OBDDataService.classifyEngineHealth(data),
        temperatureStatus: OBDDataService.classifyTemperatureStatus(data.engineTemperature ?? undefined),
        rpmStatus: OBDDataService.classifyRPMStatus(data.rpm ?? undefined),
        throttleStatus: OBDDataService.classifyThrottleStatus(data.throttlePosition),
        faultCodesCount: data.faultCodes?.length || 0,
        hasActiveFaults: (data.faultCodes?.length || 0) > 0,
        performanceScore: OBDDataService.calculatePerformanceScore(data)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('OBDDataService::getOBDDataByVehicleInterval success', { 
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
        logger.error('OBDDataService::getOBDDataByVehicleInterval', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch OBD data by interval',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getOBDDataByVehicleInterval', appError);
      throw appError;
    }
  }

  async getOBDDataByPlateNumber(params: PaginationParams & {
    plateNumber: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: OBDDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await OBDDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        engineHealthStatus: OBDDataService.classifyEngineHealth(data),
        temperatureStatus: OBDDataService.classifyTemperatureStatus(data.engineTemperature ?? undefined),
        rpmStatus: OBDDataService.classifyRPMStatus(data.rpm ?? undefined),
        throttleStatus: OBDDataService.classifyThrottleStatus(data.throttlePosition),
        faultCodesCount: data.faultCodes?.length || 0,
        hasActiveFaults: (data.faultCodes?.length || 0) > 0,
        performanceScore: OBDDataService.calculatePerformanceScore(data)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('OBDDataService::getOBDDataByPlateNumber success', { 
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
        logger.error('OBDDataService::getOBDDataByPlateNumber', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getOBDDataByPlateNumber', appError);
      throw appError;
    }
  }

  async updateOBDData(id: number, dto: UpdateOBDDataDTO): Promise<OBDDataResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid OBD data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate OBD values if being updated
      if (dto.rpm !== undefined && (isNaN(dto.rpm) || dto.rpm < 0 || dto.rpm > 10000)) {
        throw new AppError('RPM must be between 0 and 10000', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.throttlePosition !== undefined && (isNaN(dto.throttlePosition) || dto.throttlePosition < 0 || dto.throttlePosition > 100)) {
        throw new AppError('Throttle position must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.engineTemperature !== undefined && (isNaN(dto.engineTemperature) || dto.engineTemperature < -40 || dto.engineTemperature > 200)) {
        throw new AppError('Engine temperature must be between -40 and 200°C', HttpStatusCode.BAD_REQUEST);
      }

      const existingRecord = await OBDDataRepository.findByIdWithRelations(id);

      if (!existingRecord) {
        throw new AppError('OBD data not found', HttpStatusCode.NOT_FOUND);
      }

      const updatedOBDData = await OBDDataRepository.update(id, dto);

      // Re-analyze engine status if critical values were updated
      const criticalFieldsUpdated = 
        dto.rpm !== undefined || 
        dto.engineTemperature !== undefined || 
        dto.faultCodes !== undefined;

      if (criticalFieldsUpdated && existingRecord.vehicleId) {
        await OBDDataService.updateVehicleEngineStatus(existingRecord.vehicleId, updatedOBDData);
      }

      // Add enhanced fields
      const enhancedData = {
        ...updatedOBDData,
        engineHealthStatus: OBDDataService.classifyEngineHealth(updatedOBDData),
        temperatureStatus: OBDDataService.classifyTemperatureStatus(updatedOBDData.engineTemperature ?? undefined),
        rpmStatus: OBDDataService.classifyRPMStatus(updatedOBDData.rpm ?? undefined),
        throttleStatus: OBDDataService.classifyThrottleStatus(updatedOBDData.throttlePosition),
        faultCodesCount: updatedOBDData.faultCodes?.length || 0,
        hasActiveFaults: (updatedOBDData.faultCodes?.length || 0) > 0,
        performanceScore: OBDDataService.calculatePerformanceScore(updatedOBDData)
      };

      logger.info('OBDDataService::updateOBDData success', { id });
      return enhancedData;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('OBDDataService::updateOBDData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to update OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::updateOBDData', appError);
      throw appError;
    }
  }

  async deleteOBDData(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid OBD data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingRecord = await OBDDataRepository.findById(id);

      if (!existingRecord) {
        throw new AppError('OBD data not found', HttpStatusCode.NOT_FOUND);
      }

      await OBDDataRepository.delete(id);

      logger.info('OBDDataService::deleteOBDData success', { id });
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('OBDDataService::deleteOBDData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to delete OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::deleteOBDData', appError);
      throw appError;
    }
  }

  async getOBDStatistics(params: {
    vehicleId?: number;
    interval?: string;
    startTime?: Date;
    endTime?: Date;
    engineStatus?: string;
  }): Promise<OBDStatisticsResponseDTO> {
    try {
      const { vehicleId, interval, startTime, endTime, engineStatus } = params;

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

      if (engineStatus) {
        whereClause.engineStatus = engineStatus;
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

      const obdData = await OBDDataRepository.findAllForStatistics(whereClause);

      if (obdData.length === 0) {
        return {
          data: {
            summary: {
              totalRecords: 0,
              averageRPM: '0',
              averageThrottlePosition: '0',
              averageEngineTemperature: '0',
              totalFaultCodes: 0,
              vehiclesWithFaults: 0,
              criticalEngineIssues: 0
            },
            engineAnalysis: {
              healthy: 0, warning: 0, critical: 0,
              healthyPercentage: '0', warningPercentage: '0', criticalPercentage: '0'
            },
            temperatureAnalysis: {
              normal: 0, high: 0, overheating: 0,
              normalPercentage: '0', highPercentage: '0', overheatingPercentage: '0'
            },
            rpmAnalysis: {
              idle: 0, normal: 0, high: 0, redline: 0,
              idlePercentage: '0', normalPercentage: '0', highPercentage: '0', redlinePercentage: '0'
            },
            faultCodeAnalysis: {
              mostCommonFaults: {},
              faultTrends: { increasing: [], decreasing: [], stable: [] }
            },
            performanceMetrics: {
              averagePerformanceScore: 0,
              topPerformingVehicles: [],
              poorPerformingVehicles: [],
              maintenanceRequired: []
            },
            thresholds: OBD_THRESHOLDS,
            timeRange: interval ? { interval } : {
              from: startTime || 'beginning',
              to: endTime || 'now'
            }
          }
        };
      }

      // Calculate comprehensive statistics
      let rpmSum = 0, rpmCount = 0;
      let throttleSum = 0;
      let tempSum = 0, tempCount = 0;
      let totalFaultCodes = 0;
      let healthyCount = 0, warningCount = 0, criticalCount = 0;
      let normalTempCount = 0, highTempCount = 0, overheatingCount = 0;
      let idleRpmCount = 0, normalRpmCount = 0, highRpmCount = 0, redlineRpmCount = 0;
      let totalPerformanceScore = 0;

      const faultCodeCounts: { [key: string]: number } = {};
      const vehiclesWithFaults = new Set<string>();

      obdData.forEach(data => {
        // RPM analysis
        if (data.rpm !== null) {
          rpmSum += data.rpm;
          rpmCount++;
          
          const rpmStatus = OBDDataService.classifyRPMStatus(data.rpm);
          if (rpmStatus === 'IDLE') idleRpmCount++;
          else if (rpmStatus === 'NORMAL') normalRpmCount++;
          else if (rpmStatus === 'HIGH') highRpmCount++;
          else if (rpmStatus === 'REDLINE') redlineRpmCount++;
        }

        // Throttle analysis
        throttleSum += data.throttlePosition;

        // Temperature analysis
        if (data.engineTemperature !== null) {
          tempSum += data.engineTemperature;
          tempCount++;
          
          const tempStatus = OBDDataService.classifyTemperatureStatus(data.engineTemperature);
          if (tempStatus === 'NORMAL') normalTempCount++;
          else if (tempStatus === 'HIGH') highTempCount++;
          else if (tempStatus === 'OVERHEATING') overheatingCount++;
        }

        // Engine health analysis
        const engineHealth = OBDDataService.classifyEngineHealth(data);
        if (engineHealth === 'HEALTHY') healthyCount++;
        else if (engineHealth === 'WARNING') warningCount++;
        else if (engineHealth === 'CRITICAL') criticalCount++;

        // Fault code analysis
        if (data.faultCodes && data.faultCodes.length > 0) {
          totalFaultCodes += data.faultCodes.length;
          vehiclesWithFaults.add(data.plateNumber);
          
          data.faultCodes.forEach(code => {
            faultCodeCounts[code] = (faultCodeCounts[code] || 0) + 1;
          });
        }

        // Performance score
        totalPerformanceScore += OBDDataService.calculatePerformanceScore(data);
      });

      const averageRPM = rpmCount > 0 ? rpmSum / rpmCount : 0;
      const averageThrottlePosition = throttleSum / obdData.length;
      const averageEngineTemperature = tempCount > 0 ? tempSum / tempCount : 0;
      const averagePerformanceScore = totalPerformanceScore / obdData.length;

      // Find most common fault codes
      const mostCommonFaults: any = {};
      Object.entries(faultCodeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([code, count]) => {
          mostCommonFaults[code] = {
            count,
            description: `Fault code ${code}`, // Would be populated from fault code database
            severity: count > 5 ? 'HIGH' : count > 2 ? 'MEDIUM' : 'LOW'
          };
        });

      logger.info('OBDDataService::getOBDStatistics success', { 
        totalRecords: obdData.length,
        totalFaultCodes,
        vehiclesWithFaults: vehiclesWithFaults.size 
      });

      return {
        data: {
          summary: {
            totalRecords: obdData.length,
            averageRPM: averageRPM.toFixed(0),
            averageThrottlePosition: averageThrottlePosition.toFixed(1),
            averageEngineTemperature: averageEngineTemperature.toFixed(1),
            totalFaultCodes,
            vehiclesWithFaults: vehiclesWithFaults.size,
            criticalEngineIssues: criticalCount
          },
          engineAnalysis: {
            healthy: healthyCount,
            warning: warningCount,
            critical: criticalCount,
            healthyPercentage: ((healthyCount / obdData.length) * 100).toFixed(1),
            warningPercentage: ((warningCount / obdData.length) * 100).toFixed(1),
            criticalPercentage: ((criticalCount / obdData.length) * 100).toFixed(1)
          },
          temperatureAnalysis: {
            normal: normalTempCount,
            high: highTempCount,
            overheating: overheatingCount,
            normalPercentage: tempCount > 0 ? ((normalTempCount / tempCount) * 100).toFixed(1) : '0',
            highPercentage: tempCount > 0 ? ((highTempCount / tempCount) * 100).toFixed(1) : '0',
            overheatingPercentage: tempCount > 0 ? ((overheatingCount / tempCount) * 100).toFixed(1) : '0'
          },
          rpmAnalysis: {
            idle: idleRpmCount,
            normal: normalRpmCount,
            high: highRpmCount,
            redline: redlineRpmCount,
            idlePercentage: rpmCount > 0 ? ((idleRpmCount / rpmCount) * 100).toFixed(1) : '0',
            normalPercentage: rpmCount > 0 ? ((normalRpmCount / rpmCount) * 100).toFixed(1) : '0',
            highPercentage: rpmCount > 0 ? ((highRpmCount / rpmCount) * 100).toFixed(1) : '0',
            redlinePercentage: rpmCount > 0 ? ((redlineRpmCount / rpmCount) * 100).toFixed(1) : '0'
          },
          faultCodeAnalysis: {
            mostCommonFaults,
            faultTrends: {
              increasing: [], // Would be calculated from historical data
              decreasing: [],
              stable: []
            }
          },
          performanceMetrics: {
            averagePerformanceScore: parseFloat(averagePerformanceScore.toFixed(1)),
            topPerformingVehicles: [], // Would be calculated from performance scores
            poorPerformingVehicles: [],
            maintenanceRequired: Array.from(vehiclesWithFaults)
          },
          thresholds: OBD_THRESHOLDS,
          timeRange: interval ? { interval } : {
            from: startTime || 'beginning',
            to: endTime || 'now'
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('OBDDataService::getOBDStatistics', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to calculate OBD statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataService::getOBDStatistics', appError);
      throw appError;
    }
  }

  // Get OBD diagnostic thresholds
  getOBDThresholds(): OBDThresholds {
    return OBD_THRESHOLDS;
  }
}

export default new OBDDataService();