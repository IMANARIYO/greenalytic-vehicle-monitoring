import { GpsData, Prisma } from '@prisma/client';
import logger from '../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler.js';
import prisma from '../config/db.js';

interface GpsDataWithRelations extends GpsData {
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
  } | null;
}

interface GpsDataCreateInput {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy?: number | null;
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId?: number | null;
  trackingStatus?: boolean;
  timestamp?: Date;
}

interface GpsDataUpdateInput {
  latitude?: number;
  longitude?: number;
  speed?: number;
  accuracy?: number | null;
  plateNumber?: string;
  trackingStatus?: boolean;
  timestamp?: Date;
}

class GpsDataRepository {
  async create(data: GpsDataCreateInput): Promise<GpsDataWithRelations> {
    try {
      return await prisma.gpsData.create({
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          accuracy: data.accuracy,
          vehicleId: data.vehicleId,
          plateNumber: data.plateNumber,
          trackingDeviceId: data.trackingDeviceId,
          trackingStatus: data.trackingStatus !== undefined ? data.trackingStatus : true,
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
        logger.error('GpsDataRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<GpsData | null> {
    try {
      return await prisma.gpsData.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithRelations(id: number): Promise<GpsDataWithRelations> {
    try {
      const gpsData = await prisma.gpsData.findUnique({
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

      if (!gpsData) {
        throw new NotFoundError('GPS data');
      }

      return gpsData;
    } catch (error: any) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        logger.error('GpsDataRepository::findByIdWithRelations', error);
        throw error;
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findByIdWithRelations', appError);
        throw appError;
      }

      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data with relations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findByIdWithRelations', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.GpsDataWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.gpsData.findMany({
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
        prisma.gpsData.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findAllForStatistics(whereClause: Prisma.GpsDataWhereInput): Promise<GpsData[]> {
    try {
      return await prisma.gpsData.findMany({
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
        logger.error('GpsDataRepository::findAllForStatistics', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data for statistics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findAllForStatistics', appError);
      throw appError;
    }
  }

  async update(id: number, data: GpsDataUpdateInput): Promise<GpsDataWithRelations> {
    try {
      const updateData: Prisma.GpsDataUpdateInput = {};
      
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.speed !== undefined) updateData.speed = data.speed;
      if (data.accuracy !== undefined) updateData.accuracy = data.accuracy;
      if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
      if (data.trackingStatus !== undefined) updateData.trackingStatus = data.trackingStatus;
      if (data.timestamp !== undefined) updateData.timestamp = data.timestamp;

      return await prisma.gpsData.update({
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
        logger.error('GpsDataRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<GpsData> {
    try {
      return await prisma.gpsData.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::delete', appError);
      throw appError;
    }
  }

  async findByVehicleId(
    vehicleId: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.GpsDataWhereInput = { vehicleId };

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
        logger.error('GpsDataRepository::findByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findByVehicleId', appError);
      throw appError;
    }
  }

  async findByPlateNumber(
    plateNumber: string,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.GpsDataWhereInput = { plateNumber };

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
        logger.error('GpsDataRepository::findByPlateNumber', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by plate number',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findByPlateNumber', appError);
      throw appError;
    }
  }

  async findByTrackingDeviceId(
    trackingDeviceId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.GpsDataWhereInput = { trackingDeviceId };
      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findByTrackingDeviceId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by tracking device ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findByTrackingDeviceId', appError);
      throw appError;
    }
  }

  async findByLocationRadius(
    centerLatitude: number,
    centerLongitude: number,
    radiusKm: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      // Calculate bounding box for initial filtering (approximate)
      const latDelta = radiusKm / 111; // Approximate km per degree of latitude
      const lonDelta = radiusKm / (111 * Math.cos(centerLatitude * Math.PI / 180)); // Adjust for longitude

      const whereClause: Prisma.GpsDataWhereInput = {
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

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findByLocationRadius', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by location radius',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findByLocationRadius', appError);
      throw appError;
    }
  }

  async findBySpeedRange(
    minSpeed: number,
    maxSpeed: number,
    page: number = 1,
    limit: number = 10,
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: GpsDataWithRelations[]; totalCount: number }> {
    try {
      const whereClause: Prisma.GpsDataWhereInput = {
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

      return this.findManyWithFilters(whereClause, page, limit);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::findBySpeedRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find GPS data by speed range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findBySpeedRange', appError);
      throw appError;
    }
  }

  async countGpsData(): Promise<number> {
    try {
      return await prisma.gpsData.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::countGpsData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::countGpsData', appError);
      throw appError;
    }
  }

  async countBySpeedLevel(thresholds: any): Promise<{ normal: number; high: number; critical: number }> {
    try {
      const [critical, high, total] = await Promise.all([
        // Critical speed
        prisma.gpsData.count({
          where: {
            speed: { gte: thresholds.speed.critical }
          }
        }),
        // High speed (warning level but not critical)
        prisma.gpsData.count({
          where: {
            speed: { 
              gte: thresholds.speed.warning, 
              lt: thresholds.speed.critical 
            }
          }
        }),
        // Total count
        this.countGpsData()
      ]);

      const normal = total - high - critical;

      return { normal, high, critical };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::countBySpeedLevel', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count GPS data by speed level',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::countBySpeedLevel', appError);
      throw appError;
    }
  }

  async getLatestByVehicleId(vehicleId: number): Promise<GpsDataWithRelations | null> {
    try {
      return await prisma.gpsData.findFirst({
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
        logger.error('GpsDataRepository::getLatestByVehicleId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get latest GPS data by vehicle ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::getLatestByVehicleId', appError);
      throw appError;
    }
  }

  async getPreviousGpsData(vehicleId: number, timestamp: Date): Promise<GpsData | null> {
    try {
      return await prisma.gpsData.findFirst({
        where: { 
          vehicleId, 
          timestamp: { lt: timestamp }
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::getPreviousGpsData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get previous GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::getPreviousGpsData', appError);
      throw appError;
    }
  }

  async getNextGpsData(vehicleId: number, timestamp: Date): Promise<GpsData | null> {
    try {
      return await prisma.gpsData.findFirst({
        where: { 
          vehicleId, 
          timestamp: { gt: timestamp }
        },
        orderBy: { timestamp: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::getNextGpsData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get next GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::getNextGpsData', appError);
      throw appError;
    }
  }

  async findRecentGpsData(
    hours: number = 24,
    limit: number = 10
  ): Promise<GpsDataWithRelations[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await prisma.gpsData.findMany({
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
        logger.error('GpsDataRepository::findRecentGpsData', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find recent GPS data',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findRecentGpsData', appError);
      throw appError;
    }
  }

  async findVehicleRoute(
    vehicleId: number,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<GpsDataWithRelations[]> {
    try {
      return await prisma.gpsData.findMany({
        where: {
          vehicleId,
          timestamp: {
            gte: startTime,
            lte: endTime
          }
        },
        take: limit,
        orderBy: { timestamp: 'asc' },
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
        logger.error('GpsDataRepository::findVehicleRoute', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find vehicle route',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::findVehicleRoute', appError);
      throw appError;
    }
  }

  async getSpeedViolationsCount(
    speedThreshold: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<number> {
    try {
      const whereClause: Prisma.GpsDataWhereInput = {
        speed: { gte: speedThreshold }
      };

      if (startTime && endTime) {
        whereClause.timestamp = { gte: startTime, lte: endTime };
      } else if (startTime) {
        whereClause.timestamp = { gte: startTime };
      } else if (endTime) {
        whereClause.timestamp = { lte: endTime };
      }

      return await prisma.gpsData.count({
        where: whereClause
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('GpsDataRepository::getSpeedViolationsCount', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count speed violations',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('GpsDataRepository::getSpeedViolationsCount', appError);
      throw appError;
    }
  }
}

export default new GpsDataRepository();