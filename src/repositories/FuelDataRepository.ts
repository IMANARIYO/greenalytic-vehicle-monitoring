import { FuelData, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';
import prisma from '../config/db';

interface FuelDataWithRelations extends FuelData {
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

interface FuelDataCreateInput {
  fuelLevel: number;
  fuelConsumption: number;
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

interface FuelDataUpdateInput {
  fuelLevel?: number;
  fuelConsumption?: number;
  plateNumber?: string;
  timestamp?: Date;
}

class FuelDataRepository {
  async create(data: FuelDataCreateInput): Promise<FuelDataWithRelations> {
    try {
      return await prisma.fuelData.create({
        data: {
          fuelLevel: data.fuelLevel,
          fuelConsumption: data.fuelConsumption,
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
        logger.error('FuelDataRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<FuelData | null> {
    try {
      return await prisma.fuelData.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithRelations(id: number): Promise<FuelDataWithRelations> {
    try {
      const fuelData = await prisma.fuelData.findUnique({
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

      if (!fuelData) {
        throw new NotFoundError('Fuel data');
      }

      return fuelData;
    } catch (error: any) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        logger.error('FuelDataRepository::findByIdWithRelations', error);
        throw error;
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findByIdWithRelations', appError);
        throw appError;
      }

      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data with relations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByIdWithRelations', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.FuelDataWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.fuelData.findMany({
          where: whereClause,
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
        prisma.fuelData.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findAllForStatistics(whereClause: Prisma.FuelDataWhereInput): Promise<FuelData[]> {
    try {
      return await prisma.fuelData.findMany({
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
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findAllForStatistics', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data for statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findAllForStatistics', appError);
      throw appError;
    }
  }

  async update(id: number, data: FuelDataUpdateInput): Promise<FuelDataWithRelations> {
    try {
      const updateData: Prisma.FuelDataUpdateInput = {};
      
      if (data.fuelLevel !== undefined) updateData.fuelLevel = data.fuelLevel;
      if (data.fuelConsumption !== undefined) updateData.fuelConsumption = data.fuelConsumption;
      if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
      if (data.timestamp !== undefined) updateData.timestamp = data.timestamp;

      return await prisma.fuelData.update({
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
        logger.error('FuelDataRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<FuelData> {
    try {
      return await prisma.fuelData.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::delete', appError);
      throw appError;
    }
  }

  async findByVehicleId(
    vehicleId: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = { vehicleId };

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
        logger.error('FuelDataRepository::findByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByVehicleId', appError);
      throw appError;
    }
  }

  async findByPlateNumber(
    plateNumber: string,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = { plateNumber };

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
        logger.error('FuelDataRepository::findByPlateNumber', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by plate number',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByPlateNumber', appError);
      throw appError;
    }
  }

  async findByTrackingDeviceId(
    trackingDeviceId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = { trackingDeviceId };
      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findByTrackingDeviceId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by tracking device ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByTrackingDeviceId', appError);
      throw appError;
    }
  }

  async findByConsumptionRange(
    minConsumption: number,
    maxConsumption: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = {
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

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findByConsumptionRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by consumption range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByConsumptionRange', appError);
      throw appError;
    }
  }

  async findByFuelLevelRange(
    minFuelLevel: number,
    maxFuelLevel: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: FuelDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = {
        fuelLevel: {
          gte: minFuelLevel,
          lte: maxFuelLevel
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

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::findByFuelLevelRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find fuel data by fuel level range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findByFuelLevelRange', appError);
      throw appError;
    }
  }

  async countFuelData(): Promise<number> {
    try {
      return await prisma.fuelData.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::countFuelData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::countFuelData', appError);
      throw appError;
    }
  }

  async countByConsumptionLevel(thresholds: any): Promise<{ low: number; normal: number; high: number; critical: number }> {
    try {
      const [critical, high, low, total] = await Promise.all([
        // Critical consumption
        prisma.fuelData.count({
          where: {
            fuelConsumption: { gte: thresholds.consumption.critical }
          }
        }),
        // High consumption (warning level but not critical)
        prisma.fuelData.count({
          where: {
            fuelConsumption: { 
              gte: thresholds.consumption.warning, 
              lt: thresholds.consumption.critical 
            }
          }
        }),
        // Low consumption (excellent efficiency)
        prisma.fuelData.count({
          where: {
            fuelConsumption: { lte: thresholds.efficiency.excellent }
          }
        }),
        // Total count
        this.countFuelData()
      ]);

      const normal = total - high - critical - low;

      return { low, normal, high, critical };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::countByConsumptionLevel', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count fuel data by consumption level',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::countByConsumptionLevel', appError);
      throw appError;
    }
  }

  async countByFuelLevel(thresholds: any): Promise<{ critical: number; low: number; normal: number; full: number }> {
    try {
      const [critical, low, full, total] = await Promise.all([
        // Critical fuel level
        prisma.fuelData.count({
          where: {
            fuelLevel: { lte: thresholds.level.critical }
          }
        }),
        // Low fuel level
        prisma.fuelData.count({
          where: {
            fuelLevel: { 
              gt: thresholds.level.critical,
              lte: thresholds.level.low 
            }
          }
        }),
        // Full tank (>=80%)
        prisma.fuelData.count({
          where: {
            fuelLevel: { gte: 80 }
          }
        }),
        // Total count
        this.countFuelData()
      ]);

      const normal = total - critical - low - full;

      return { critical, low, normal, full };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::countByFuelLevel', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count fuel data by fuel level',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::countByFuelLevel', appError);
      throw appError;
    }
  }

  async getLatestByVehicleId(vehicleId: number): Promise<FuelDataWithRelations | null> {
    try {
      return await prisma.fuelData.findFirst({
        where: { vehicleId },
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
        logger.error('FuelDataRepository::getLatestByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get latest fuel data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::getLatestByVehicleId', appError);
      throw appError;
    }
  }

  async findRecentFuelData(
    hours: number = 24,
    limit: number = 10
  ): Promise<FuelDataWithRelations[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await prisma.fuelData.findMany({
        where: {
          timestamp: { gte: startTime }
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
        logger.error('FuelDataRepository::findRecentFuelData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find recent fuel data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::findRecentFuelData', appError);
      throw appError;
    }
  }

  async getConsumptionViolationsCount(
    consumptionThreshold: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<number> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = {
        fuelConsumption: { gte: consumptionThreshold }
      };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      return await prisma.fuelData.count({
        where: whereClause
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::getConsumptionViolationsCount', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count consumption violations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::getConsumptionViolationsCount', appError);
      throw appError;
    }
  }

  async getLowFuelVehiclesCount(
    fuelLevelThreshold: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<number> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = {
        fuelLevel: { lte: fuelLevelThreshold }
      };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      return await prisma.fuelData.count({
        where: whereClause
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::getLowFuelVehiclesCount', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count low fuel vehicles',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::getLowFuelVehiclesCount', appError);
      throw appError;
    }
  }

  async getAverageConsumptionByVehicle(
    vehicleId: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<number> {
    try {
      const whereClause: Prisma.FuelDataWhereInput = { vehicleId };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      const result = await prisma.fuelData.aggregate({
        where: whereClause,
        _avg: {
          fuelConsumption: true
        }
      });

      return result._avg.fuelConsumption || 0;
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FuelDataRepository::getAverageConsumptionByVehicle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get average consumption by vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FuelDataRepository::getAverageConsumptionByVehicle', appError);
      throw appError;
    }
  }
}

export default new FuelDataRepository();