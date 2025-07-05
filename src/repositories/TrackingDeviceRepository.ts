import { Prisma } from '@prisma/client';
import { DeviceStatus, CommunicationProtocol, DeviceCategory } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../config/db';
import { AppError, HttpStatusCode, handlePrismaError } from '../middlewares/errorHandler';

export class TrackingDeviceRepository {
  static async createDevice(data: Prisma.TrackingDeviceCreateInput) {
    try {
      return await prisma.trackingDevice.create({ 
        data,
        include: {
          user: true,
          vehicle: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to create device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async getDeviceById(id: number) {
    try {
      const device = await prisma.trackingDevice.findUnique({
        where: { id },
        include: {
          user: true,
          vehicle: true,
          gpsData: { orderBy: { timestamp: 'desc' }, take: 20 },
          fuelData: { orderBy: { timestamp: 'desc' }, take: 20 },
          emissionData: { orderBy: { timestamp: 'desc' }, take: 20 },
          obdData: { orderBy: { timestamp: 'desc' }, take: 20 },
          deviceHeartbeats: { orderBy: { timestamp: 'desc' }, take: 10 }
        }
      });
      if (!device) throw new AppError('Device not found', HttpStatusCode.NOT_FOUND);
      return device;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error;
    }
  }

  static async updateDevice(id: number, data: Prisma.TrackingDeviceUpdateInput) {
    try {
      return await prisma.trackingDevice.update({
        where: { id },
        data,
        include: {
          user: true,
          vehicle: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to update device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async softDeleteDevice(id: number) {
    try {
      return await prisma.trackingDevice.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to soft delete device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async restoreDevice(id: number) {
    try {
      return await prisma.trackingDevice.update({
        where: { id },
        data: { deletedAt: null }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to restore device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async deleteDevicePermanently(id: number) {
    try {
      return await prisma.trackingDevice.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to delete device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async listDevices(params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: {
      status?: DeviceStatus;
      deviceCategory?: DeviceCategory;
      protocol?: CommunicationProtocol;
      userId?: number;
      vehicleId?: number;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const { page = 1, limit = 10, search, filters = {}, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.TrackingDeviceWhereInput = {
        deletedAt: null,
        ...(filters.status && { status: filters.status }),
        ...(filters.deviceCategory && { deviceCategory: filters.deviceCategory }),
        ...(filters.protocol && { communicationProtocol: filters.protocol }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      };

      if (search) {
        whereClause.OR = [
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { plateNumber: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        ];
      }

      const [devices, total] = await Promise.all([
        prisma.trackingDevice.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              }
            },
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                vehicleType: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.trackingDevice.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: devices,
        meta: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : undefined,
          prevPage: hasPrevPage ? page - 1 : undefined,
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to list devices', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async assignToVehicle(deviceId: number, vehicleId: number) {
    try {
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { vehicleId },
        include: {
          vehicle: true,
          user: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to assign device to vehicle', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async unassignFromVehicle(deviceId: number) {
    try {
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { vehicleId: null },
        include: {
          user: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to unassign device', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}