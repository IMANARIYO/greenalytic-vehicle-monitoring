import { EmissionData, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { PaginationMeta, PaginationParams } from '../types/GrobalTypes';
import prisma from '../config/db';

interface EmissionDataWithRelations extends EmissionData {
  vehicle?: {
    plateNumber: string;
    vehicleModel: string;
    vehicleType: string;
    status: string;
    fuelType: string | null;
    user?: {
      username: string | null;
      companyName: string | null;
    };
  };
  trackingDevice?: {
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  };
}

interface EmissionDataCreateInput {
  co2Percentage: number;
  coPercentage: number;
  o2Percentage: number;
  hcPPM: number;
  noxPPM?: number | null;
  pm25Level?: number | null;
  vehicleId: number;
  plateNumber?: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

interface EmissionDataUpdateInput {
  co2Percentage?: number;
  coPercentage?: number;
  o2Percentage?: number;
  hcPPM?: number;
  noxPPM?: number | null;
  pm25Level?: number | null;
  vehicleId?: number;
  plateNumber?: string;
  trackingDeviceId?: number;
  timestamp?: Date;
  deletedAt?: Date | null;
}

class EmissionDataRepository {
  async create(data: EmissionDataCreateInput): Promise<EmissionDataWithRelations> {
    try {
      return await prisma.emissionData.create({
        data: {
          co2Percentage: data.co2Percentage,
          coPercentage: data.coPercentage,
          o2Percentage: data.o2Percentage,
          hcPPM: data.hcPPM,
          noxPPM: data.noxPPM,
          pm25Level: data.pm25Level,
          vehicleId: data.vehicleId,
          plateNumber: data.plateNumber,
          trackingDeviceId: data.trackingDeviceId,
          timestamp: data.timestamp || new Date()
        },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              vehicleType: true,
              status: true,
              fuelType: true,
              user: {
                select: {
                  username: true,
                  companyName: true,
                }
              }
            }
          },
          trackingDevice: {
            select: {
              serialNumber: true,
              model: true,
              deviceCategory: true,
              status: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::create', error);
      throw error;
    }
  }

  async findById(id: number): Promise<EmissionData | null> {
    try {
      return await prisma.emissionData.findUnique({
        where: { id }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::findById', error);
      throw error;
    }
  }

  async findByIdWithRelations(id: number): Promise<EmissionDataWithRelations | null> {
    try {
      return await prisma.emissionData.findUnique({
        where: { id },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              vehicleType: true,
              fuelType: true,
              status: true,
              user: {
                select: {
                  username: true,
                  companyName: true,
                }
              }
            }
          },
          trackingDevice: {
            select: {
              serialNumber: true,
              model: true,
              deviceCategory: true,
              status: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::findByIdWithRelations', error);
      throw error;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.EmissionDataWhereInput,
    page: number,
    limit: number
  ): Promise<{ data: EmissionDataWithRelations[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.emissionData.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            vehicle: {
              select: {
                plateNumber: true,
                vehicleModel: true,
                vehicleType: true,
                status: true,
                fuelType: true,
              }
            },
            trackingDevice: {
              select: {
                serialNumber: true,
                model: true,
                deviceCategory: true,
                status: true,
              }
            }
          }
        }),
        prisma.emissionData.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error) {
      logger.error('EmissionDataRepository::findManyWithFilters', error);
      throw error;
    }
  }

  async findAllForStatistics(whereClause: Prisma.EmissionDataWhereInput): Promise<EmissionData[]> {
    try {
      return await prisma.emissionData.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              status: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::findAllForStatistics', error);
      throw error;
    }
  }

  async update(id: number, data: EmissionDataUpdateInput): Promise<EmissionDataWithRelations> {
    try {
      const updateData: Prisma.EmissionDataUpdateInput = {};
      
      if (data.co2Percentage !== undefined) updateData.co2Percentage = data.co2Percentage;
      if (data.coPercentage !== undefined) updateData.coPercentage = data.coPercentage;
      if (data.o2Percentage !== undefined) updateData.o2Percentage = data.o2Percentage;
      if (data.hcPPM !== undefined) updateData.hcPPM = data.hcPPM;
      if (data.noxPPM !== undefined) updateData.noxPPM = data.noxPPM;
      if (data.pm25Level !== undefined) updateData.pm25Level = data.pm25Level;
      if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
      if (data.timestamp !== undefined) updateData.timestamp = data.timestamp;
      if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

      return await prisma.emissionData.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              vehicleType: true,
              status: true,
              fuelType: true,
            }
          },
          trackingDevice: {
            select: {
              serialNumber: true,
              model: true,
              deviceCategory: true,
              status: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::update', error);
      throw error;
    }
  }

  async delete(id: number): Promise<EmissionData> {
    try {
      return await prisma.emissionData.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::delete', error);
      throw error;
    }
  }

  async findByVehicleId(
    vehicleId: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: EmissionDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.EmissionDataWhereInput = { vehicleId };

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

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error) {
      logger.error('EmissionDataRepository::findByVehicleId', error);
      throw error;
    }
  }

  async findByPlateNumber(
    plateNumber: string,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: EmissionDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.EmissionDataWhereInput = { plateNumber };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error) {
      logger.error('EmissionDataRepository::findByPlateNumber', error);
      throw error;
    }
  }

  async findByTrackingDeviceId(
    trackingDeviceId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: EmissionDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.EmissionDataWhereInput = { trackingDeviceId };
      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error) {
      logger.error('EmissionDataRepository::findByTrackingDeviceId', error);
      throw error;
    }
  }

  async countEmissionData(): Promise<number> {
    try {
      return await prisma.emissionData.count({
        where: { deletedAt: null }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::countEmissionData', error);
      throw error;
    }
  }

  async countByEmissionLevel(thresholds: any): Promise<{ normal: number; high: number; critical: number }> {
    try {
      const [critical, high, total] = await Promise.all([
        // Critical emissions
        prisma.emissionData.count({
          where: {
            deletedAt: null,
            OR: [
              { co2Percentage: { gte: thresholds.co2.critical } },
              { coPercentage: { gte: thresholds.co.critical } },
              { hcPPM: { gte: thresholds.hc.critical } },
              { noxPPM: { gte: thresholds.nox.critical } },
              { pm25Level: { gte: thresholds.pm25.critical } }
            ]
          }
        }),
        // High emissions (warning level but not critical)
        prisma.emissionData.count({
          where: {
            deletedAt: null,
            OR: [
              { co2Percentage: { gte: thresholds.co2.warning, lt: thresholds.co2.critical } },
              { coPercentage: { gte: thresholds.co.warning, lt: thresholds.co.critical } },
              { hcPPM: { gte: thresholds.hc.warning, lt: thresholds.hc.critical } },
              { noxPPM: { gte: thresholds.nox.warning, lt: thresholds.nox.critical } },
              { pm25Level: { gte: thresholds.pm25.warning, lt: thresholds.pm25.critical } }
            ]
          }
        }),
        // Total count
        this.countEmissionData()
      ]);

      const normal = total - high - critical;

      return { normal, high, critical };
    } catch (error) {
      logger.error('EmissionDataRepository::countByEmissionLevel', error);
      throw error;
    }
  }

  async getLatestByVehicleId(vehicleId: number): Promise<EmissionDataWithRelations | null> {
    try {
      return await prisma.emissionData.findFirst({
        where: { vehicleId, deletedAt: null },
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              vehicleType: true,
              status: true,
              fuelType: true,
            }
          },
          trackingDevice: {
            select: {
              serialNumber: true,
              model: true,
              deviceCategory: true,
              status: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::getLatestByVehicleId', error);
      throw error;
    }
  }

  async findRecentEmissions(
    hours: number = 24,
    limit: number = 10
  ): Promise<EmissionDataWithRelations[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await prisma.emissionData.findMany({
        where: {
          timestamp: { gte: startTime },
          deletedAt: null
        },
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleModel: true,
              vehicleType: true,
              status: true,
              fuelType: true,
            }
          },
          trackingDevice: {
            select: {
              serialNumber: true,
              status: true,
              model: true,
              deviceCategory: true,
            }
          }
        }
      });
    } catch (error) {
      logger.error('EmissionDataRepository::findRecentEmissions', error);
      throw error;
    }
  }
}

export default new EmissionDataRepository();