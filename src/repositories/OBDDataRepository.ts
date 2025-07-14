import { OBDData, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';
import prisma from '../config/db';

interface OBDDataWithRelations extends OBDData {
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

interface OBDDataCreateInput {
  rpm?: number | null;
  throttlePosition: number;
  engineTemperature?: number | null;
  engineStatus?: string | null;
  faultCodes: string[];
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

interface OBDDataUpdateInput {
  rpm?: number | null;
  throttlePosition?: number;
  engineTemperature?: number | null;
  engineStatus?: string | null;
  faultCodes?: string[];
  plateNumber?: string;
  timestamp?: Date;
}

class OBDDataRepository {
  async create(data: OBDDataCreateInput): Promise<OBDDataWithRelations> {
    try {
      return await prisma.oBDData.create({
        data: {
          rpm: data.rpm,
          throttlePosition: data.throttlePosition,
          engineTemperature: data.engineTemperature,
          engineStatus: data.engineStatus,
          faultCodes: data.faultCodes,
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
        logger.error('OBDDataRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<OBDData | null> {
    try {
      return await prisma.oBDData.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithRelations(id: number): Promise<OBDDataWithRelations> {
    try {
      const obdData = await prisma.oBDData.findUnique({
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

      if (!obdData) {
        throw new NotFoundError('OBD data');
      }

      return obdData;
    } catch (error: any) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        logger.error('OBDDataRepository::findByIdWithRelations', error);
        throw error;
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::findByIdWithRelations', appError);
        throw appError;
      }

      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data with relations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByIdWithRelations', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.OBDDataWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.oBDData.findMany({
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
        prisma.oBDData.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findAllForStatistics(whereClause: Prisma.OBDDataWhereInput): Promise<OBDData[]> {
    try {
      return await prisma.oBDData.findMany({
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
        logger.error('OBDDataRepository::findAllForStatistics', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data for statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findAllForStatistics', appError);
      throw appError;
    }
  }

  async update(id: number, data: OBDDataUpdateInput): Promise<OBDDataWithRelations> {
    try {
      const updateData: Prisma.OBDDataUpdateInput = {};
      
      if (data.rpm !== undefined) updateData.rpm = data.rpm;
      if (data.throttlePosition !== undefined) updateData.throttlePosition = data.throttlePosition;
      if (data.engineTemperature !== undefined) updateData.engineTemperature = data.engineTemperature;
      if (data.engineStatus !== undefined) updateData.engineStatus = data.engineStatus;
      if (data.faultCodes !== undefined) updateData.faultCodes = data.faultCodes;
      if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
      if (data.timestamp !== undefined) updateData.timestamp = data.timestamp;

      return await prisma.oBDData.update({
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
        logger.error('OBDDataRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<OBDData> {
    try {
      return await prisma.oBDData.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::delete', appError);
      throw appError;
    }
  }

  async findByVehicleId(
    vehicleId: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = { vehicleId };

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
        logger.error('OBDDataRepository::findByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByVehicleId', appError);
      throw appError;
    }
  }

  async findByPlateNumber(
    plateNumber: string,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = { plateNumber };

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
        logger.error('OBDDataRepository::findByPlateNumber', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by plate number',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByPlateNumber', appError);
      throw appError;
    }
  }

  async findByTrackingDeviceId(
    trackingDeviceId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = { trackingDeviceId };
      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::findByTrackingDeviceId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by tracking device ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByTrackingDeviceId', appError);
      throw appError;
    }
  }

  async findByEngineStatus(
    engineStatus: string,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = { engineStatus };

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
        logger.error('OBDDataRepository::findByEngineStatus', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by engine status',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByEngineStatus', appError);
      throw appError;
    }
  }

  async findWithFaultCodes(
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = {
        faultCodes: {
          isEmpty: false
        }
      };

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
        logger.error('OBDDataRepository::findWithFaultCodes', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data with fault codes',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findWithFaultCodes', appError);
      throw appError;
    }
  }

  async findByRPMRange(
    minRPM: number,
    maxRPM: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = {
        rpm: {
          gte: minRPM,
          lte: maxRPM
        }
      };

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
        logger.error('OBDDataRepository::findByRPMRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by RPM range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByRPMRange', appError);
      throw appError;
    }
  }

  async findByTemperatureRange(
    minTemp: number,
    maxTemp: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OBDDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.OBDDataWhereInput = {
        engineTemperature: {
          gte: minTemp,
          lte: maxTemp
        }
      };

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
        logger.error('OBDDataRepository::findByTemperatureRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find OBD data by temperature range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findByTemperatureRange', appError);
      throw appError;
    }
  }

  async countOBDData(): Promise<number> {
    try {
      return await prisma.oBDData.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('OBDDataRepository::countOBDData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::countOBDData', appError);
      throw appError;
    }
  }

  async getLatestByVehicleId(vehicleId: number): Promise<OBDDataWithRelations | null> {
    try {
      return await prisma.oBDData.findFirst({
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
        logger.error('OBDDataRepository::getLatestByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get latest OBD data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::getLatestByVehicleId', appError);
      throw appError;
    }
  }

  async findRecentOBDData(
    hours: number = 24,
    limit: number = 10
  ): Promise<OBDDataWithRelations[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await prisma.oBDData.findMany({
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
        logger.error('OBDDataRepository::findRecentOBDData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find recent OBD data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('OBDDataRepository::findRecentOBDData', appError);
      throw appError;
    }
  }
}

export default new OBDDataRepository();