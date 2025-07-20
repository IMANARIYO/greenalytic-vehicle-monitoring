import { 
  CreateFuelDataDTO, 
  UpdateFuelDataDTO, 
  FuelDataQueryDTO,
  FuelDataResponseDTO,
  FuelStatisticsResponseDTO,
  FuelDataListResponseDTO,
  VehicleFuelDataResponseDTO,
  CreateFuelDataResponseDTO,
  FuelConsumptionThresholds,
  FuelDataWithEfficiencyDTO,
  ConsumptionRangeResponseDTO,
  FuelEfficiencyAnalysisDTO
} from '../types/dtos/FuelDataDto.js';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes.js';
import FuelDataRepository from '../repositories/FuelDataRepository.js';
import VehicleRepository from '../repositories/VehicleRepository.js';
import {TrackingDeviceRepository} from '../repositories/TrackingDeviceRepository.js';
import { AlertRepository } from '../repositories/AlertRepository.js';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler.js';
import logger from '../utils/logger.js';

// Fuel consumption thresholds - These need to be confirmed with Emmanuel
const FUEL_THRESHOLDS: FuelConsumptionThresholds = {
  consumption: { warning: 15, critical: 20 }, // L/100km
  level: { low: 10, critical: 5 }, // Fuel level percentage
  efficiency: { poor: 5, excellent: 12 }, // km/L
  cost: { budget: 50, high: 80 } // Cost per 100km
};

interface AlertData {
  type: string;
  title: string;
  message: string;
  triggerValue: string;
  triggerThreshold: string;
  vehicleId: number;
}

export class FuelDataService {
  
  // Helper function to calculate fuel efficiency (km/L)
  private static calculateFuelEfficiency(distance: number, fuelConsumed: number): number {
    if (fuelConsumed === 0) return 0;
    return distance / fuelConsumed;
  }

  // Helper function to estimate fuel cost
  private static calculateFuelCost(consumption: number, fuelPrice: number = 1.5): number {
    return (consumption / 100) * fuelPrice; // Cost per km
  }

  // Helper function to estimate remaining range
  private static calculateEstimatedRange(fuelLevel: number, tankCapacity: number = 50, efficiency: number = 8): number {
    const remainingFuel = (fuelLevel / 100) * tankCapacity;
    return remainingFuel * efficiency;
  }

  // Helper function to analyze fuel levels and generate alerts
  private static async analyzeFuelLevels(
    fuelData: any, 
    vehicleId: number, 
    plateNumber: string
  ): Promise<AlertData[]> {
    try {
      const alerts: AlertData[] = [];
      
      // Check fuel level
      if (fuelData.fuelLevel <= FUEL_THRESHOLDS.level.critical) {
        alerts.push({
          type: 'FUEL_ANOMALY_ALERT',
          title: 'Critical Fuel Level',
          message: `Vehicle ${plateNumber} has critically low fuel level (${fuelData.fuelLevel}%)`,
          triggerValue: `${fuelData.fuelLevel}%`,
          triggerThreshold: `Fuel level ≤ ${FUEL_THRESHOLDS.level.critical}%`,
          vehicleId,
        });
      } else if (fuelData.fuelLevel <= FUEL_THRESHOLDS.level.low) {
        alerts.push({
          type: 'FUEL_ANOMALY_ALERT',
          title: 'Low Fuel Level',
          message: `Vehicle ${plateNumber} has low fuel level (${fuelData.fuelLevel}%)`,
          triggerValue: `${fuelData.fuelLevel}%`,
          triggerThreshold: `Fuel level ≤ ${FUEL_THRESHOLDS.level.low}%`,
          vehicleId,
        });
      }

      // Check fuel consumption
      if (fuelData.fuelConsumption >= FUEL_THRESHOLDS.consumption.critical) {
        alerts.push({
          type: 'FUEL_ANOMALY_ALERT',
          title: 'Critical Fuel Consumption',
          message: `Vehicle ${plateNumber} has critically high fuel consumption (${fuelData.fuelConsumption} L/100km)`,
          triggerValue: `${fuelData.fuelConsumption} L/100km`,
          triggerThreshold: `Consumption ≥ ${FUEL_THRESHOLDS.consumption.critical} L/100km`,
          vehicleId,
        });
      } else if (fuelData.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning) {
        alerts.push({
          type: 'FUEL_ANOMALY_ALERT',
          title: 'High Fuel Consumption',
          message: `Vehicle ${plateNumber} has high fuel consumption (${fuelData.fuelConsumption} L/100km)`,
          triggerValue: `${fuelData.fuelConsumption} L/100km`,
          triggerThreshold: `Consumption ≥ ${FUEL_THRESHOLDS.consumption.warning} L/100km`,
          vehicleId,
        });
      }

      return alerts;
    } catch (error) {
      logger.error('FuelDataService::analyzeFuelLevels failed', error);
      throw error;
    }
  }

  // Helper function to update vehicle fuel status
  private static async updateVehicleFuelStatus(vehicleId: number, fuelData: any): Promise<string> {
    try {
      const lowFuelLevel = fuelData.fuelLevel <= FUEL_THRESHOLDS.level.low;
      const highConsumption = fuelData.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning;

      let newStatus = 'NORMAL_EMISSION';
      if (lowFuelLevel && highConsumption) {
        newStatus = 'UNDER_MAINTENANCE'; // Needs immediate attention
      } else if (highConsumption) {
        newStatus = 'TOP_POLLUTING'; // High consumption could indicate inefficiency
      }

      // Update vehicle status
      await VehicleRepository.updateVehicle(vehicleId, { status: newStatus as any });

      return newStatus;
    } catch (error) {
      logger.error('FuelDataService::updateVehicleFuelStatus failed', error);
      throw error;
    }
  }

  // Helper function to classify fuel level
  private static classifyFuelLevel(fuelLevel: number): 'LOW' | 'NORMAL' | 'HIGH' {
    if (fuelLevel <= FUEL_THRESHOLDS.level.low) return 'LOW';
    if (fuelLevel >= 80) return 'HIGH';
    return 'NORMAL';
  }

  // Helper function to classify consumption efficiency
  private static classifyConsumptionEfficiency(consumption: number): 'EFFICIENT' | 'NORMAL' | 'POOR' {
    if (consumption <= 8) return 'EFFICIENT';
    if (consumption >= FUEL_THRESHOLDS.consumption.warning) return 'POOR';
    return 'NORMAL';
  }

  async createFuelData(dto: CreateFuelDataDTO): Promise<CreateFuelDataResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['vehicleId', 'fuelLevel', 'fuelConsumption', 'plateNumber', 'trackingDeviceId'];
      const missingFields = requiredFields.filter(field => 
        dto[field as keyof CreateFuelDataDTO] === undefined || dto[field as keyof CreateFuelDataDTO] === null
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

      // Validate fuel values ranges
      const validations = [
        { field: 'fuelLevel', value: dto.fuelLevel, min: 0, max: 100 },
        { field: 'fuelConsumption', value: dto.fuelConsumption, min: 0, max: 50 }
      ];

      for (const validation of validations) {
        if (isNaN(validation.value) || validation.value < validation.min || validation.value > validation.max) {
          throw new AppError(
            `${validation.field} must be a number between ${validation.min} and ${validation.max}`,
            HttpStatusCode.BAD_REQUEST
          );
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

      // Create fuel data
      const fuelData = await FuelDataRepository.create({
        fuelLevel: dto.fuelLevel,
        fuelConsumption: dto.fuelConsumption,
        vehicleId: dto.vehicleId,
        plateNumber: dto.plateNumber,
        trackingDeviceId: dto.trackingDeviceId,
        timestamp: dto.timestamp || new Date()
      });

      // Update tracking device status
      TrackingDeviceRepository.updateDevice(dto.trackingDeviceId, { lastPing: new Date() });

      // Analyze fuel levels and generate alerts
      const alerts = await FuelDataService.analyzeFuelLevels(
        fuelData, 
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

      // Update vehicle fuel status
      const vehicleStatus = await FuelDataService.updateVehicleFuelStatus(dto.vehicleId, fuelData);

      // Calculate enhanced fields
      const fuelLevelStatus = FuelDataService.classifyFuelLevel(dto.fuelLevel);
      const consumptionStatus = FuelDataService.classifyConsumptionEfficiency(dto.fuelConsumption);
      const lowFuelAlert = dto.fuelLevel <= FUEL_THRESHOLDS.level.low;
      const highConsumptionAlert = dto.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning;
      const estimatedRange = FuelDataService.calculateEstimatedRange(dto.fuelLevel);

      // Generate recommendations
      const recommendations = {
        refuelingSuggested: dto.fuelLevel <= FUEL_THRESHOLDS.level.low,
        maintenanceRecommended: dto.fuelConsumption >= FUEL_THRESHOLDS.consumption.critical,
        efficiencyTips: dto.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning ? [
          'Check tire pressure regularly',
          'Avoid aggressive driving',
          'Consider regular maintenance',
          'Plan efficient routes'
        ] : []
      };

      logger.info('FuelDataService::createFuelData success', { 
        fuelDataId: fuelData.id,
        vehicleId: dto.vehicleId,
        alertsGenerated: alerts.length,
        lowFuelAlert,
        highConsumptionAlert
      });

      return {
        message: 'Fuel data created successfully',
        data: {
          ...fuelData,
          fuelLevelStatus,
          consumptionStatus,
          estimatedRange,
          costEstimate: FuelDataService.calculateFuelCost(dto.fuelConsumption)
        },
        lowFuelAlert,
        highConsumptionAlert,
        alertsGenerated: alerts.length,
        alerts: alerts.map(alert => ({
          type: alert.type,
          title: alert.title,
          severity: alert.title.includes('Critical') ? 'CRITICAL' : 'WARNING'
        })),
        recommendations
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FuelDataService::createFuelData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::createFuelData', appError);
      throw appError;
    }
  }

  async getAllFuelData(params: PaginationParams & {
    startTime?: Date;
    endTime?: Date;
    vehicleStatus?: string;
    fuelLevel?: string;
    consumptionLevel?: string;
    minConsumption?: number;
    maxConsumption?: number;
    minFuelLevel?: number;
    maxFuelLevel?: number;
  }): Promise<{ data: FuelDataResponseDTO[]; meta: PaginationMeta }> {
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
        fuelLevel,
        consumptionLevel,
        minConsumption,
        maxConsumption,
        minFuelLevel,
        maxFuelLevel
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

      // Validate fuel level filter
      if (fuelLevel && !['LOW', 'NORMAL', 'HIGH'].includes(fuelLevel)) {
        throw new AppError('Invalid fuel level. Must be LOW, NORMAL, or HIGH', HttpStatusCode.BAD_REQUEST);
      }

      // Validate consumption level filter
      if (consumptionLevel && !['EFFICIENT', 'NORMAL', 'POOR'].includes(consumptionLevel)) {
        throw new AppError('Invalid consumption level. Must be EFFICIENT, NORMAL, or POOR', HttpStatusCode.BAD_REQUEST);
      }

      // Validate fuel ranges
      if (minFuelLevel !== undefined && (isNaN(minFuelLevel) || minFuelLevel < 0 || minFuelLevel > 100)) {
        throw new AppError('Minimum fuel level must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
      }

      if (maxFuelLevel !== undefined && (isNaN(maxFuelLevel) || maxFuelLevel < 0 || maxFuelLevel > 100)) {
        throw new AppError('Maximum fuel level must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
      }

      if (minFuelLevel !== undefined && maxFuelLevel !== undefined && minFuelLevel > maxFuelLevel) {
        throw new AppError('Minimum fuel level cannot be greater than maximum fuel level', HttpStatusCode.BAD_REQUEST);
      }

      // Validate consumption ranges
      if (minConsumption !== undefined && (isNaN(minConsumption) || minConsumption < 0)) {
        throw new AppError('Minimum consumption must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (maxConsumption !== undefined && (isNaN(maxConsumption) || maxConsumption < 0)) {
        throw new AppError('Maximum consumption must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (minConsumption !== undefined && maxConsumption !== undefined && minConsumption > maxConsumption) {
        throw new AppError('Minimum consumption cannot be greater than maximum consumption', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = [
        'id', 'timestamp', 'fuelLevel', 'fuelConsumption', 'vehicleId', 'plateNumber', 'createdAt'
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

      // Fuel level range filtering
      if (minFuelLevel !== undefined || maxFuelLevel !== undefined) {
        whereClause.fuelLevel = {};
        if (minFuelLevel !== undefined) whereClause.fuelLevel.gte = minFuelLevel;
        if (maxFuelLevel !== undefined) whereClause.fuelLevel.lte = maxFuelLevel;
      }

      // Consumption range filtering
      if (minConsumption !== undefined || maxConsumption !== undefined) {
        whereClause.fuelConsumption = {};
        if (minConsumption !== undefined) whereClause.fuelConsumption.gte = minConsumption;
        if (maxConsumption !== undefined) whereClause.fuelConsumption.lte = maxConsumption;
      }

      // Filter by fuel level category
      if (fuelLevel === 'LOW') {
        whereClause.fuelLevel = {
          ...whereClause.fuelLevel,
          lte: FUEL_THRESHOLDS.level.low
        };
      } else if (fuelLevel === 'HIGH') {
        whereClause.fuelLevel = {
          ...whereClause.fuelLevel,
          gte: 80
        };
      } else if (fuelLevel === 'NORMAL') {
        whereClause.fuelLevel = {
          ...whereClause.fuelLevel,
          gt: FUEL_THRESHOLDS.level.low,
          lt: 80
        };
      }

      // Filter by consumption efficiency
      if (consumptionLevel === 'EFFICIENT') {
        whereClause.fuelConsumption = {
          ...whereClause.fuelConsumption,
          lte: 8
        };
      } else if (consumptionLevel === 'POOR') {
        whereClause.fuelConsumption = {
          ...whereClause.fuelConsumption,
          gte: FUEL_THRESHOLDS.consumption.warning
        };
      } else if (consumptionLevel === 'NORMAL') {
        whereClause.fuelConsumption = {
          ...whereClause.fuelConsumption,
          gt: 8,
          lt: FUEL_THRESHOLDS.consumption.warning
        };
      }

      const result = await FuelDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data to each record
      const enhancedData = result.data.map(data => {
        const fuelLevelStatus = FuelDataService.classifyFuelLevel(data.fuelLevel);
        const consumptionStatus = FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption);
        
        return {
          ...data,
          fuelLevelStatus,
          consumptionStatus,
          fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, data.fuelConsumption), // Assuming 100km
          estimatedRange: FuelDataService.calculateEstimatedRange(data.fuelLevel),
          costEstimate: FuelDataService.calculateFuelCost(data.fuelConsumption)
        };
      });

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FuelDataService::getAllFuelData success', { 
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
        logger.error('FuelDataService::getAllFuelData', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getAllFuelData', appError);
      throw appError;
    }
  }

  async getFuelDataById(id: number): Promise<FuelDataWithEfficiencyDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid fuel data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const fuelData = await FuelDataRepository.findByIdWithRelations(id);

      if (!fuelData) {
        throw new AppError('Fuel data not found', HttpStatusCode.NOT_FOUND);
      }

      // Calculate efficiency analysis
      const currentEfficiency = FuelDataService.calculateFuelEfficiency(100, fuelData.fuelConsumption);
      const benchmarkEfficiency = 8; // Average efficiency for comparison
      
      let efficiencyRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' = 'AVERAGE';
      if (currentEfficiency >= FUEL_THRESHOLDS.efficiency.excellent) efficiencyRating = 'EXCELLENT';
      else if (currentEfficiency >= 8) efficiencyRating = 'GOOD';
      else if (currentEfficiency <= FUEL_THRESHOLDS.efficiency.poor) efficiencyRating = 'POOR';

      const potentialSavings = Math.max(0, (fuelData.fuelConsumption - 8) * 1.5); // Potential monthly savings

      const improvementSuggestions = [];
      if (fuelData.fuelConsumption > 12) {
        improvementSuggestions.push('Schedule immediate maintenance check');
        improvementSuggestions.push('Review driving patterns for efficiency');
      }
      if (fuelData.fuelConsumption > 8) {
        improvementSuggestions.push('Check tire pressure and alignment');
        improvementSuggestions.push('Consider fuel system cleaning');
      }

      // Calculate cost analysis
      const currentCost = FuelDataService.calculateFuelCost(fuelData.fuelConsumption) * 100; // Per 100km
      const benchmarkCost = FuelDataService.calculateFuelCost(8) * 100; // Benchmark per 100km
      const monthlyCostEstimate = currentCost * 20; // Assuming 2000km/month
      const annualCostEstimate = monthlyCostEstimate * 12;

      const enhancedData: FuelDataWithEfficiencyDTO = {
        ...fuelData,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(fuelData.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(fuelData.fuelConsumption),
        fuelEfficiency: currentEfficiency,
        estimatedRange: FuelDataService.calculateEstimatedRange(fuelData.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(fuelData.fuelConsumption),
        efficiencyAnalysis: {
          currentEfficiency,
          benchmarkEfficiency,
          efficiencyRating,
          potentialSavings,
          improvementSuggestions
        },
        costAnalysis: {
          currentCost,
          benchmarkCost,
          monthlyCostEstimate,
          annualCostEstimate
        },
        thresholds: FUEL_THRESHOLDS
      };

      logger.info('FuelDataService::getFuelDataById success', { id });
      return enhancedData;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FuelDataService::getFuelDataById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelDataById', appError);
      throw appError;
    }
  }

  async getFuelDataByVehicle(params: PaginationParams & {
    vehicleId: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: FuelDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await FuelDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(data.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption),
        fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, data.fuelConsumption),
        estimatedRange: FuelDataService.calculateEstimatedRange(data.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(data.fuelConsumption)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FuelDataService::getFuelDataByVehicle success', { 
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
        logger.error('FuelDataService::getFuelDataByVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelDataByVehicle', appError);
      throw appError;
    }
  }

  // Get fuel consumption thresholds
  getFuelThresholds(): FuelConsumptionThresholds {
    return FUEL_THRESHOLDS;
  }
  async getFuelDataByVehicleInterval(params: PaginationParams & {
    vehicleId: number;
    interval: string;
    intervalValue: string;
  }): Promise<{ data: FuelDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await FuelDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(data.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption),
        fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, data.fuelConsumption),
        estimatedRange: FuelDataService.calculateEstimatedRange(data.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(data.fuelConsumption)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FuelDataService::getFuelDataByVehicleInterval success', { 
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
        logger.error('FuelDataService::getFuelDataByVehicleInterval', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch fuel data by interval',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelDataByVehicleInterval', appError);
      throw appError;
    }
  }
  async getFuelDataByPlateNumber(params: PaginationParams & {
    plateNumber: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<{ data: FuelDataResponseDTO[]; meta: PaginationMeta }> {
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

      const result = await FuelDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data
      const enhancedData = result.data.map(data => ({
        ...data,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(data.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption),
        fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, data.fuelConsumption),
        estimatedRange: FuelDataService.calculateEstimatedRange(data.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(data.fuelConsumption)
      }));

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FuelDataService::getFuelDataByPlateNumber success', { 
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
        logger.error('FuelDataService::getFuelDataByPlateNumber', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelDataByPlateNumber', appError);
      throw appError;
    }
  }
  async getFuelDataByConsumptionRange(params: PaginationParams & {
    minConsumption: number;
    maxConsumption: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<ConsumptionRangeResponseDTO> {
    try {
      const { minConsumption, maxConsumption, page = 1, limit = 10, startTime, endTime } = params;

      // Validate consumption range
      if (isNaN(minConsumption) || minConsumption < 0) {
        throw new AppError('Minimum consumption must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (isNaN(maxConsumption) || maxConsumption < 0) {
        throw new AppError('Maximum consumption must be a non-negative number', HttpStatusCode.BAD_REQUEST);
      }

      if (minConsumption > maxConsumption) {
        throw new AppError('Minimum consumption cannot be greater than maximum consumption', HttpStatusCode.BAD_REQUEST);
      }

      const whereClause: any = {
        fuelConsumption: {
          gte: minConsumption,
          lte: maxConsumption
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

      const result = await FuelDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add enhanced data and calculate statistics
      const enhancedData = result.data.map(data => ({
        ...data,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(data.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption),
        fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, data.fuelConsumption),
        estimatedRange: FuelDataService.calculateEstimatedRange(data.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(data.fuelConsumption)
      }));

      // Calculate consumption statistics
      const totalConsumption = result.data.reduce((sum, data) => sum + data.fuelConsumption, 0);
      const averageConsumption = result.data.length > 0 ? totalConsumption / result.data.length : 0;
      const inefficientRecords = result.data.filter(data => data.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning).length;

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FuelDataService::getFuelDataByConsumptionRange success', { 
        minConsumption,
        maxConsumption,
        totalCount: result.totalCount,
        inefficientRecords 
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
          consumptionRange: {
            minConsumption,
            maxConsumption,
            averageConsumption: parseFloat(averageConsumption.toFixed(2)),
            totalConsumption: parseFloat(totalConsumption.toFixed(2)),
            inefficientRecords
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('FuelDataService::getFuelDataByConsumptionRange', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch fuel data by consumption range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelDataByConsumptionRange', appError);
      throw appError;
    }
  }

  async updateFuelData(id: number, dto: UpdateFuelDataDTO): Promise<FuelDataResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid fuel data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Validate fuel values if being updated
      if (dto.fuelLevel !== undefined) {
        if (isNaN(dto.fuelLevel) || dto.fuelLevel < 0 || dto.fuelLevel > 100) {
          throw new AppError('Fuel level must be between 0 and 100', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.fuelConsumption !== undefined) {
        if (isNaN(dto.fuelConsumption) || dto.fuelConsumption < 0 || dto.fuelConsumption > 50) {
          throw new AppError('Fuel consumption must be between 0 and 50 L/100km', HttpStatusCode.BAD_REQUEST);
        }
      }

      const existingRecord = await FuelDataRepository.findByIdWithRelations(id);

      if (!existingRecord) {
        throw new AppError('Fuel data not found', HttpStatusCode.NOT_FOUND);
      }

      const updatedFuelData = await FuelDataRepository.update(id, dto);

      // Re-analyze fuel levels if values were updated
      const fuelFieldsUpdated = dto.fuelLevel !== undefined || dto.fuelConsumption !== undefined;

      if (fuelFieldsUpdated && existingRecord.vehicleId) {
        await FuelDataService.updateVehicleFuelStatus(existingRecord.vehicleId, updatedFuelData);
      }

      // Add enhanced fields
      const enhancedData = {
        ...updatedFuelData,
        fuelLevelStatus: FuelDataService.classifyFuelLevel(updatedFuelData.fuelLevel),
        consumptionStatus: FuelDataService.classifyConsumptionEfficiency(updatedFuelData.fuelConsumption),
        fuelEfficiency: FuelDataService.calculateFuelEfficiency(100, updatedFuelData.fuelConsumption),
        estimatedRange: FuelDataService.calculateEstimatedRange(updatedFuelData.fuelLevel),
        costEstimate: FuelDataService.calculateFuelCost(updatedFuelData.fuelConsumption)
      };

      logger.info('FuelDataService::updateFuelData success', { id });
      return enhancedData;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('FuelDataService::updateFuelData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to update fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::updateFuelData', appError);
      throw appError;
    }
  }

  async deleteFuelData(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid fuel data ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingRecord = await FuelDataRepository.findById(id);

      if (!existingRecord) {
        throw new AppError('Fuel data not found', HttpStatusCode.NOT_FOUND);
      }

      await FuelDataRepository.delete(id);

      logger.info('FuelDataService::deleteFuelData success', { id });
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('FuelDataService::deleteFuelData', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to delete fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::deleteFuelData', appError);
      throw appError;
    }
  }

  async getFuelStatistics(params: {
    vehicleId?: number;
    interval?: string;
    startTime?: Date;
    endTime?: Date;
    fuelType?: string;
  }): Promise<FuelStatisticsResponseDTO> {
    try {
      const { vehicleId, interval, startTime, endTime, fuelType } = params;

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

      if (fuelType) {
        whereClause.vehicle = {
          fuelType: fuelType
        };
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

      const fuelData = await FuelDataRepository.findAllForStatistics(whereClause);

      if (fuelData.length === 0) {
        return {
          data: {
            summary: {
              totalRecords: 0,
              averageFuelLevel: '0',
              averageConsumption: '0',
              totalConsumption: '0',
              estimatedTotalCost: '0',
              highConsumptionCount: 0,
              lowFuelLevelCount: 0
            },
            consumptionAnalysis: {
              efficient: 0, normal: 0, poor: 0,
              efficientPercentage: '0', normalPercentage: '0', poorPercentage: '0'
            },
            fuelLevelAnalysis: {
              low: 0, normal: 0, high: 0,
              lowPercentage: '0', normalPercentage: '0', highPercentage: '0'
            },
            trends: {
              consumptionTrend: 'STABLE',
              fuelLevelTrend: 'STABLE',
              efficiencyTrend: 'STABLE'
            },
            thresholds: FUEL_THRESHOLDS,
            timeRange: interval ? { interval } : {
              from: startTime || 'beginning',
              to: endTime || 'now'
            }
          }
        };
      }

      // Calculate comprehensive statistics
      let totalFuelLevel = 0;
      let totalConsumption = 0;
      let highConsumptionCount = 0;
      let lowFuelLevelCount = 0;
      let efficientCount = 0, normalConsumptionCount = 0, poorCount = 0;
      let lowLevelCount = 0, normalLevelCount = 0, highLevelCount = 0;

      fuelData.forEach(data => {
        totalFuelLevel += data.fuelLevel;
        totalConsumption += data.fuelConsumption;

        if (data.fuelConsumption >= FUEL_THRESHOLDS.consumption.warning) {
          highConsumptionCount++;
        }

        if (data.fuelLevel <= FUEL_THRESHOLDS.level.low) {
          lowFuelLevelCount++;
        }

        // Consumption analysis
        const consumptionStatus = FuelDataService.classifyConsumptionEfficiency(data.fuelConsumption);
        if (consumptionStatus === 'EFFICIENT') efficientCount++;
        else if (consumptionStatus === 'NORMAL') normalConsumptionCount++;
        else if (consumptionStatus === 'POOR') poorCount++;

        // Fuel level analysis
        const levelStatus = FuelDataService.classifyFuelLevel(data.fuelLevel);
        if (levelStatus === 'LOW') lowLevelCount++;
        else if (levelStatus === 'NORMAL') normalLevelCount++;
        else if (levelStatus === 'HIGH') highLevelCount++;
      });

      const averageFuelLevel = totalFuelLevel / fuelData.length;
      const averageConsumption = totalConsumption / fuelData.length;
      const estimatedTotalCost = FuelDataService.calculateFuelCost(averageConsumption) * fuelData.length * 100;

      // Calculate trends (simplified - could be enhanced with time series analysis)
      const sortedByTime = fuelData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const firstHalf = sortedByTime.slice(0, Math.floor(sortedByTime.length / 2));
      const secondHalf = sortedByTime.slice(Math.floor(sortedByTime.length / 2));

      const firstHalfAvgConsumption = firstHalf.reduce((sum, d) => sum + d.fuelConsumption, 0) / firstHalf.length;
      const secondHalfAvgConsumption = secondHalf.reduce((sum, d) => sum + d.fuelConsumption, 0) / secondHalf.length;
      const firstHalfAvgLevel = firstHalf.reduce((sum, d) => sum + d.fuelLevel, 0) / firstHalf.length;
      const secondHalfAvgLevel = secondHalf.reduce((sum, d) => sum + d.fuelLevel, 0) / secondHalf.length;

      const consumptionTrend = Math.abs(secondHalfAvgConsumption - firstHalfAvgConsumption) < 0.5 ? 'STABLE' :
                              secondHalfAvgConsumption > firstHalfAvgConsumption ? 'INCREASING' : 'DECREASING';
      
      const fuelLevelTrend = Math.abs(secondHalfAvgLevel - firstHalfAvgLevel) < 5 ? 'STABLE' :
                            secondHalfAvgLevel > firstHalfAvgLevel ? 'INCREASING' : 'DECREASING';
      
      const efficiencyTrend = consumptionTrend === 'DECREASING' ? 'IMPROVING' :
                             consumptionTrend === 'INCREASING' ? 'DECLINING' : 'STABLE';

      logger.info('FuelDataService::getFuelStatistics success', { 
        totalRecords: fuelData.length,
        highConsumptionCount,
        lowFuelLevelCount
      });

      return {
        data: {
          summary: {
            totalRecords: fuelData.length,
            averageFuelLevel: averageFuelLevel.toFixed(1),
            averageConsumption: averageConsumption.toFixed(2),
            totalConsumption: totalConsumption.toFixed(2),
            estimatedTotalCost: estimatedTotalCost.toFixed(2),
            highConsumptionCount,
            lowFuelLevelCount
          },
          consumptionAnalysis: {
            efficient: efficientCount,
            normal: normalConsumptionCount,
            poor: poorCount,
            efficientPercentage: ((efficientCount / fuelData.length) * 100).toFixed(1),
            normalPercentage: ((normalConsumptionCount / fuelData.length) * 100).toFixed(1),
            poorPercentage: ((poorCount / fuelData.length) * 100).toFixed(1)
          },
          fuelLevelAnalysis: {
            low: lowLevelCount,
            normal: normalLevelCount,
            high: highLevelCount,
            lowPercentage: ((lowLevelCount / fuelData.length) * 100).toFixed(1),
            normalPercentage: ((normalLevelCount / fuelData.length) * 100).toFixed(1),
            highPercentage: ((highLevelCount / fuelData.length) * 100).toFixed(1)
          },
          trends: {
            consumptionTrend,
            fuelLevelTrend,
            efficiencyTrend
          },
          thresholds: FUEL_THRESHOLDS,
          timeRange: interval ? { interval } : {
            from: startTime || 'beginning',
            to: endTime || 'now'
          }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('FuelDataService::getFuelStatistics', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to calculate fuel statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataService::getFuelStatistics', appError);
      throw appError;
    }
  }

}

export default new FuelDataService();