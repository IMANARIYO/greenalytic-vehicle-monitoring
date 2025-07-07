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
} from '../types/dtos/EmissionDataDto';
import EmissionDataRepository from '../repositories/EmissionDataRepository';
import VehicleRepository from '../repositories/VehicleRepository';
import { TrackingDeviceRepository } from '../repositories/TrackingDeviceRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import logger from '../utils/logger';

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

class EmissionDataService {
  
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

  static async createEmissionData(dto: CreateEmissionDataDTO): Promise<CreateEmissionDataResponseDTO> {
    try {
      // Verify vehicle and tracking device exist
      const [vehicle, device] = await Promise.all([
        VehicleRepository.getVehicleById(dto.vehicleId),
        TrackingDeviceRepository.getDeviceById(dto.trackingDeviceId)
      ]);

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
      if (!device) {
        throw new Error('Tracking device not found');
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
      const alerts = await this.analyzeEmissionLevels(
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
      const vehicleStatus = await this.updateVehicleEmissionStatus(dto.vehicleId, emissionData);

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
    } catch (error) {
      logger.error('EmissionDataService::createEmissionData failed', error);
      throw error;
    }
  }

  static async getAllEmissionData(query: EmissionDataQueryDTO): Promise<EmissionDataListResponseDTO> {
    try {
      // Build where clause for filtering
      const whereClause: any = {};

      // Date filtering
      if (query.startTime && query.endTime) {
        whereClause.timestamp = {
          gte: query.startTime,
          lte: query.endTime
        };
      } else if (query.startTime) {
        whereClause.timestamp = { gte: query.startTime };
      } else if (query.endTime) {
        whereClause.timestamp = { lte: query.endTime };
      }

      if (query.vehicleStatus) {
        whereClause.vehicle = {
          status: query.vehicleStatus
        };
      }

      // Filter by emission level
      if (query.emissionLevel === 'HIGH') {
        whereClause.OR = [
          { co2Percentage: { gte: EMISSION_THRESHOLDS.co2.warning } },
          { coPercentage: { gte: EMISSION_THRESHOLDS.co.warning } },
          { hcPPM: { gte: EMISSION_THRESHOLDS.hc.warning } },
          { noxPPM: { gte: EMISSION_THRESHOLDS.nox.warning } },
          { pm25Level: { gte: EMISSION_THRESHOLDS.pm25.warning } }
        ];
      } else if (query.emissionLevel === 'CRITICAL') {
        whereClause.OR = [
          { co2Percentage: { gte: EMISSION_THRESHOLDS.co2.critical } },
          { coPercentage: { gte: EMISSION_THRESHOLDS.co.critical } },
          { hcPPM: { gte: EMISSION_THRESHOLDS.hc.critical } },
          { noxPPM: { gte: EMISSION_THRESHOLDS.nox.critical } },
          { pm25Level: { gte: EMISSION_THRESHOLDS.pm25.critical } }
        ];
      }

      // Filter by device category
      if (query.deviceCategory) {
        whereClause.trackingDevice = {
          deviceCategory: query.deviceCategory
        };
      }

      const page = query.page || 1;
      const limit = query.limit || 10;

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);

      // Add emission level classification to each record
      const enhancedData = result.data.map(data => {
        const emissionLevel = this.classifyEmissionLevel(data);
        
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
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / limit),
          hasNextPage: page < Math.ceil(result.totalCount / limit),
          hasPrevPage: page > 1,
          filters: {
            applied: { 
              vehicleStatus: query.vehicleStatus, 
              emissionLevel: query.emissionLevel, 
              deviceCategory: query.deviceCategory 
            },
            thresholds: EMISSION_THRESHOLDS
          }
        }
      };
    } catch (error) {
      logger.error('EmissionDataService::getAllEmissionData failed', error);
      throw error;
    }
  }

  static async getEmissionDataById(id: number): Promise<EmissionDataWithAnalysisDTO | null> {
    try {
      const emissionData = await EmissionDataRepository.findByIdWithRelations(id);

      if (!emissionData) {
        return null;
      }

      // Add emission level analysis
      const emissionLevel = this.classifyEmissionLevel(emissionData);

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
    } catch (error) {
      logger.error('EmissionDataService::getEmissionDataById failed', error);
      throw error;
    }
  }

  static async getEmissionDataByVehicle(query: EmissionDataQueryDTO): Promise<VehicleEmissionDataResponseDTO> {
    try {
      if (!query.vehicleId) {
        throw new Error('Vehicle ID is required');
      }

      const page = query.page || 1;
      const limit = query.limit || 10;

      const whereClause: any = { vehicleId: query.vehicleId };

      if (query.startTime && query.endTime) {
        whereClause.timestamp = {
          gte: query.startTime,
          lte: query.endTime
        };
      } else if (query.startTime) {
        whereClause.timestamp = { gte: query.startTime };
      } else if (query.endTime) {
        whereClause.timestamp = { lte: query.endTime };
      }

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);

      logger.info('EmissionDataService::getEmissionDataByVehicle success', { 
        vehicleId: query.vehicleId,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
        meta: {
          currentPage: page,
          totalPages: Math.ceil(result.totalCount / limit),
          remainingItems: Math.max(0, result.totalCount - page * limit),
          totalItems: result.totalCount,
          limit
        }
      };
    } catch (error) {
      logger.error('EmissionDataService::getEmissionDataByVehicle failed', error);
      throw error;
    }
  }

  static async getEmissionDataByVehicleInterval(query: EmissionDataQueryDTO): Promise<VehicleEmissionDataResponseDTO> {
    try {
      if (!query.vehicleId || !query.interval || !query.intervalValue) {
        throw new Error('Vehicle ID, interval, and interval value are required');
      }

      const whereClause: any = { vehicleId: query.vehicleId };
      const now = new Date();
      let startTime: Date, endTime: Date | undefined;

      switch (query.interval) {
        case 'hours':
          startTime = new Date(now);
          startTime.setHours(now.getHours() - parseInt(query.intervalValue));
          break;
        case 'days':
          startTime = new Date(now);
          startTime.setDate(now.getDate() - parseInt(query.intervalValue));
          break;
        case 'daytime':
          startTime = new Date(now);
          startTime.setHours(9, 0, 0, 0);
          endTime = new Date(now);
          endTime.setHours(17, 0, 0, 0);
          break;
        default:
          throw new Error('Invalid interval. Use hours, days, or daytime');
      }

      if (query.interval === 'daytime') {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else {
        whereClause.timestamp = { gte: startTime };
      }

      const page = query.page || 1;
      const limit = query.limit || 10;

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);

      logger.info('EmissionDataService::getEmissionDataByVehicleInterval success', { 
        vehicleId: query.vehicleId,
        interval: query.interval,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
        meta: {
          currentPage: page,
          totalPages: Math.ceil(result.totalCount / limit),
          remainingItems: Math.max(0, result.totalCount - page * limit),
          totalItems: result.totalCount,
          limit,
          interval: query.interval,
          value: query.interval === 'daytime' ? 'working hours (9AM-5PM)' : query.intervalValue,
          timeRange: { from: startTime, to: endTime || now }
        }
      };
    } catch (error) {
      logger.error('EmissionDataService::getEmissionDataByVehicleInterval failed', error);
      throw error;
    }
  }

  static async getEmissionDataByPlateNumber(query: EmissionDataQueryDTO): Promise<VehicleEmissionDataResponseDTO> {
    try {
      if (!query.plateNumber) {
        throw new Error('Plate number is required');
      }

      const whereClause: any = { plateNumber: query.plateNumber };

      if (query.startTime && query.endTime) {
        whereClause.timestamp = { gte: query.startTime, lte: query.endTime };
      } else if (query.startTime) {
        whereClause.timestamp = { gte: query.startTime };
      } else if (query.endTime) {
        whereClause.timestamp = { lte: query.endTime };
      }

      const page = query.page || 1;
      const limit = query.limit || 10;

      const result = await EmissionDataRepository.findManyWithFilters(whereClause, page, limit);

      logger.info('EmissionDataService::getEmissionDataByPlateNumber success', { 
        plateNumber: query.plateNumber,
        totalCount: result.totalCount 
      });

      return {
        data: result.data,
        meta: {
          currentPage: page,
          totalPages: Math.ceil(result.totalCount / limit),
          remainingItems: Math.max(0, result.totalCount - page * limit),
          totalItems: result.totalCount,
          limit
        }
      };
    } catch (error) {
      logger.error('EmissionDataService::getEmissionDataByPlateNumber failed', error);
      throw error;
    }
  }

  static async updateEmissionData(id: number, dto: UpdateEmissionDataDTO): Promise<EmissionDataResponseDTO | null> {
    try {
      const existingRecord = await EmissionDataRepository.findByIdWithRelations(id);

      if (!existingRecord) {
        return null;
      }

      const updatedEmissionData = await EmissionDataRepository.update(id, dto);

      // Re-analyze emission levels if emission values were updated
      const emissionFieldsUpdated = 
        dto.co2Percentage !== undefined || 
        dto.coPercentage !== undefined || 
        dto.hcPPM !== undefined || 
        dto.noxPPM !== undefined || 
        dto.pm25Level !== undefined;

      if (emissionFieldsUpdated && dto.vehicleId) {
        await this.updateVehicleEmissionStatus(dto.vehicleId, updatedEmissionData);
      }

      logger.info('EmissionDataService::updateEmissionData success', { id });
      return updatedEmissionData;
    } catch (error) {
      logger.error('EmissionDataService::updateEmissionData failed', error);
      throw error;
    }
  }

  static async deleteEmissionData(id: number): Promise<boolean> {
    try {
      const existingRecord = await EmissionDataRepository.findById(id);

      if (!existingRecord) {
        return false;
      }

      await EmissionDataRepository.delete(id);

      logger.info('EmissionDataService::deleteEmissionData success', { id });
      return true;
    } catch (error) {
      logger.error('EmissionDataService::deleteEmissionData failed', error);
      throw error;
    }
  }

  static async getEmissionStatistics(query: EmissionDataQueryDTO): Promise<EmissionStatisticsResponseDTO> {
    try {
      let whereClause: any = {};

      if (query.vehicleId) {
        whereClause.vehicleId = query.vehicleId;
      }

      // Handle date filtering
      let intervalStartTime: Date | undefined;
      if (query.interval) {
        const now = new Date();

        switch (query.interval) {
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
      } else if (query.startTime && query.endTime) {
        whereClause.timestamp = { gte: query.startTime, lte: query.endTime };
      } else if (query.startTime) {
        whereClause.timestamp = { gte: query.startTime };
      } else if (query.endTime) {
        whereClause.timestamp = { lte: query.endTime };
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
            timeRange: query.interval ? { interval: query.interval } : {
              from: query.startTime || 'beginning',
              to: query.endTime || 'now'
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
          timeRange: query.interval ? { interval: query.interval } : {
            from: query.startTime || 'beginning',
            to: query.endTime || 'now'
          }
        }
      };
    } catch (error) {
      logger.error('EmissionDataService::getEmissionStatistics failed', error);
      throw error;
    }
  }

  // Get emission thresholds
  static getEmissionThresholds(): EmissionThresholds {
    return EMISSION_THRESHOLDS;
  }
}

export default EmissionDataService;