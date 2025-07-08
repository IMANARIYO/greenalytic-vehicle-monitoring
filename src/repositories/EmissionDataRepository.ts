import { EmissionData, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';
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
  plateNumber?: string;
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
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<EmissionData | null> {
    try {
      return await prisma.emissionData.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithRelations(id: number): Promise<EmissionDataWithRelations> {
    try {
      const emissionData = await prisma.emissionData.findUnique({
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

      if (!emissionData) {
        throw new NotFoundError('Emission data');
      }

      return emissionData;
    } catch (error: any) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        logger.error('EmissionDataRepository::findByIdWithRelations', error);
        throw error;
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findByIdWithRelations', appError);
        throw appError;
      }

      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data with relations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findByIdWithRelations', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.EmissionDataWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: EmissionDataWithRelations[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.emissionData.findMany({
          where: {
            ...whereClause,
            deletedAt: null // Always filter out soft deleted records
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
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
          where: {
            ...whereClause,
            deletedAt: null
          }
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findAllForStatistics(whereClause: Prisma.EmissionDataWhereInput): Promise<EmissionData[]> {
    try {
      return await prisma.emissionData.findMany({
        where: {
          ...whereClause,
          deletedAt: null
        },
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findAllForStatistics', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data for statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findAllForStatistics', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<EmissionData> {
    try {
      return await prisma.emissionData.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::delete', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findByVehicleId', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findByPlateNumber', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data by plate number',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findByPlateNumber', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findByTrackingDeviceId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find emission data by tracking device ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findByTrackingDeviceId', appError);
      throw appError;
    }
  }

  async countEmissionData(): Promise<number> {
    try {
      return await prisma.emissionData.count({
        where: { deletedAt: null }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::countEmissionData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count emission data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::countEmissionData', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::countByEmissionLevel', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count emission data by level',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::countByEmissionLevel', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::getLatestByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get latest emission data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::getLatestByVehicleId', appError);
      throw appError;
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('EmissionDataRepository::findRecentEmissions', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find recent emissions',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('EmissionDataRepository::findRecentEmissions', appError);
      throw appError;
    }
  }
}

export default new EmissionDataRepository();