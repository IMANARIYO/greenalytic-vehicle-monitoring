import { ConnectionStatus, Prisma } from '@prisma/client';
import { DeviceStatus, CommunicationProtocol, DeviceCategory } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../config/db';
import { AppError, HttpStatusCode, handlePrismaError } from '../middlewares/errorHandler';
import { getNextValidStates, isValidTransition } from '../deviceStateMachine';
import { PaginationParams } from '../types/GlobalTypes';
import { parseBoolean, sanitizeFilters } from '../queryUtils';
export interface DeviceListQueryParams extends PaginationParams {
  filters?: {
    status?: DeviceStatus;
    deviceCategory?: DeviceCategory;
    protocol?: CommunicationProtocol;
    userId?: number;
    vehicleId?: number;
  };
}

export class TrackingDeviceRepository {
  // Basic CRUD Operations
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

  // List and Search Operations
static async listDevices(params: DeviceListQueryParams) {
  try {
    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      search,
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      deletedOnly = false,
    } = params;

    // 🧼 Sanitize inputs
    const page = Number(rawPage )||1;
    const limit = Number(rawLimit)||10;
    const skip = (page - 1) * limit;
    const cleanFilters = sanitizeFilters(filters);
    const isDeletedOnly = parseBoolean(deletedOnly);
    const isIncludeDeleted = parseBoolean(includeDeleted);

    // 🧾 Log for comparison
    logger.info('TrackingDeviceRepository::listDevices — Sanitized Inputs', {
      rawPage,
      rawLimit,
      page,
      limit,
      filters,
      cleanFilters,
      deletedOnly,
      includeDeleted,
      isDeletedOnly,
      isIncludeDeleted,
    });

    // 🧱 Deleted filter logic
    const deletedFilter =
      isDeletedOnly
        ? { not: null }
        : isIncludeDeleted
        ? undefined
        : null;

    // 🔍 Build where clause
    const whereClause: Prisma.TrackingDeviceWhereInput = {
      ...(deletedFilter !== undefined ? { deletedAt: deletedFilter } : {}),
      ...(cleanFilters.status && { status: cleanFilters.status }),
      ...(cleanFilters.deviceCategory && { deviceCategory: cleanFilters.deviceCategory }),
      ...(cleanFilters.protocol && { communicationProtocol: cleanFilters.protocol }),
      ...(cleanFilters.userId && { userId: cleanFilters.userId }),
      ...(cleanFilters.vehicleId && { vehicleId: cleanFilters.vehicleId }),
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
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    logger.info('TrackingDeviceRepository::listDevices — Final Where Clause', whereClause);

    const [devices, total] = await Promise.all([
      prisma.trackingDevice.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, username: true, email: true, role: true } },
          vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.trackingDevice.count({ where: whereClause }),
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
        sortOrder,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const appError = handlePrismaError(error);
      logger.error('TrackingDeviceRepository::listDevices', appError);
      throw appError;
    }

    if (error instanceof Error) {
      const appError = new AppError(
        error.message || 'Failed to list devices',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      logger.error('TrackingDeviceRepository::listDevices', appError);
      throw appError;
    }

    const appError = new AppError(
      'Failed to list devices',
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    logger.error('TrackingDeviceRepository::listDevices', appError);
    throw appError;
  }
}





  // Device Assignment Operations
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

  // Status Management
  static async safelyUpdateDeviceStatus(
    deviceId: number,
    newStatus: DeviceStatus,
    options: {
      force?: boolean;
      disableMonitoring?: boolean;
    } = { force: false, disableMonitoring: true }
  ) {
    try {
      const device = await prisma.trackingDevice.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        throw new AppError('Device not found', HttpStatusCode.NOT_FOUND);
      }

      if (!options.force && !isValidTransition(device.status, newStatus)) {
        throw new AppError(
          `Invalid status transition from ${device.status} to ${newStatus}. ` +
          `Allowed transitions: ${getNextValidStates(device.status).join(', ')}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const updateData: Prisma.TrackingDeviceUpdateInput = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (options.disableMonitoring && newStatus !== 'ACTIVE') {
        updateData.enableOBDMonitoring = false;
        updateData.enableGPSTracking = false;
        updateData.enableEmissionMonitoring = false;
        updateData.enableFuelMonitoring = false;
      }

      if (newStatus === 'DISCONNECTED') {
        updateData.lastPing = new Date();
      }

      const updatedDevice = await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: updateData,
        include: {
          user: true,
          vehicle: true
        }
      });

      if (device.userId) {
        await this.logStatusChangeActivity(
          device.userId,
          deviceId,
          device.status,
          newStatus
        );
      }

      return updatedDevice;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error;
    }
  }

  static async batchUpdateStatuses(
    deviceIds: number[],
    newStatus: DeviceStatus,
    options: {
      force?: boolean;
      disableMonitoring?: boolean;
    } = { force: false, disableMonitoring: true }
  ) {
    try {
      const devices = await prisma.trackingDevice.findMany({
        where: { id: { in: deviceIds } }
      });

      if (!options.force) {
        const invalidTransitions = devices.filter(
          device => !isValidTransition(device.status, newStatus)
        );

        if (invalidTransitions.length > 0) {
          throw new AppError(
            `Invalid status transitions for devices: ${invalidTransitions
              .map(d => d.id)
              .join(', ')}`,
            HttpStatusCode.BAD_REQUEST
          );
        }
      }

      const updateData: Prisma.TrackingDeviceUpdateInput = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (options.disableMonitoring && newStatus !== 'ACTIVE') {
        Object.assign(updateData, {
          enableOBDMonitoring: false,
          enableGPSTracking: false,
          enableEmissionMonitoring: false,
          enableFuelMonitoring: false
        });
      }

      const [updatedDevices, _] = await prisma.$transaction([
        prisma.trackingDevice.updateMany({
          where: { id: { in: deviceIds } },
          data: updateData
        }),
        ...devices.map(device =>
          prisma.activityLog.create({
            data: {
              userId: device.userId || 1,
              action: 'DEVICE_STATUS_CHANGE',
              metadata: {
                deviceId: device.id,
                oldStatus: device.status,
                newStatus,
                timestamp: new Date()
              }
            }
          })
        )
      ]);

      return updatedDevices;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error;
    }
  }

  // Monitoring Feature Control
  static async toggleMonitoringFeature(
    deviceId: number,
    feature: {
      obd?: boolean;
      gps?: boolean;
      emission?: boolean;
      fuel?: boolean;
    },
    options: {
      ignoreStatusCheck?: boolean;
    } = { ignoreStatusCheck: false }
  ) {
    try {
      const device = await prisma.trackingDevice.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        throw new AppError('Device not found', HttpStatusCode.NOT_FOUND);
      }

      if (!options.ignoreStatusCheck && device.status !== 'ACTIVE') {
        throw new AppError(
          `Monitoring features can only be modified when device is ACTIVE. Current status: ${device.status}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const updateData: Prisma.TrackingDeviceUpdateInput = {
        updatedAt: new Date()
      };

      if (feature.obd !== undefined) updateData.enableOBDMonitoring = feature.obd;
      if (feature.gps !== undefined) updateData.enableGPSTracking = feature.gps;
      if (feature.emission !== undefined) updateData.enableEmissionMonitoring = feature.emission;
      if (feature.fuel !== undefined) updateData.enableFuelMonitoring = feature.fuel;

      const updatedDevice = await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: updateData,
        include: {
          user: true,
          vehicle: true
        }
      });

      await this.logFeatureChangeActivity(
        device.userId || undefined,
        deviceId,
        feature
      );

      return updatedDevice;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error;
    }
  }

  static async getMonitoringFeatures(deviceId: number) {
    try {
      const device = await prisma.trackingDevice.findUnique({
        where: { id: deviceId },
        select: {
          enableOBDMonitoring: true,
          enableGPSTracking: true,
          enableEmissionMonitoring: true,
          enableFuelMonitoring: true,
          status: true
        }
      });

      if (!device) {
        throw new AppError('Device not found', HttpStatusCode.NOT_FOUND);
      }

      return {
        obd: device.enableOBDMonitoring,
        gps: device.enableGPSTracking,
        emission: device.enableEmissionMonitoring,
        fuel: device.enableFuelMonitoring,
        canModify: device.status === 'ACTIVE'
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError(
        'Failed to get monitoring features',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async resetAllMonitoringFeatures(deviceId: number) {
    return this.toggleMonitoringFeature(deviceId, {
      obd: false,
      gps: false,
      emission: false,
      fuel: false
    });
  }

  // Heartbeat and Connection Management
  static async recordHeartbeat(
    deviceId: number,
    data: {
      batteryLevel?: number;
      signalStrength?: number;
      status: ConnectionStatus;
    }
  ) {
    try {
      await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: {
          lastPing: new Date(),
          batteryLevel: data.batteryLevel,
          signalStrength: data.signalStrength,
          updatedAt: new Date()
        }
      });

      return await prisma.deviceHeartbeat.create({
        data: {
          deviceId,
          status: data.status,
          timestamp: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to record device heartbeat', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  static async getDeviceHealth(deviceId: number, hoursBack = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const [device, heartbeats] = await Promise.all([
        prisma.trackingDevice.findUnique({
          where: { id: deviceId },
          select: {
            id: true,
            serialNumber: true,
            status: true,
            lastPing: true,
            batteryLevel: true,
            signalStrength: true
          }
        }),
        prisma.deviceHeartbeat.findMany({
          where: {
            deviceId,
            timestamp: { gte: cutoffTime }
          },
          orderBy: { timestamp: 'desc' }
        })
      ]);

      if (!device) {
        throw new AppError('Device not found', HttpStatusCode.NOT_FOUND);
      }

      return {
        device,
        heartbeats,
        uptimePercentage: this.calculateUptimePercentage(heartbeats),
        currentStatus: heartbeats[0]?.status || 'DISCONNECTED'
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error;
    }
  }

  // Helper Methods
  private static calculateUptimePercentage(heartbeats: { status: ConnectionStatus }[]) {
    if (heartbeats.length === 0) return 0;
    const connectedCount = heartbeats.filter(h => h.status === 'CONNECTED').length;
    return Math.round((connectedCount / heartbeats.length) * 100);
  }

  private static async logStatusChangeActivity(
    userId: number | undefined,
    deviceId: number,
    oldStatus: DeviceStatus,
    newStatus: DeviceStatus
  ) {
    try {
      if (userId) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'DEVICE_STATUS_CHANGE',
            metadata: {
              deviceId,
              oldStatus,
              newStatus,
              timestamp: new Date()
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to log device status change activity', error);
    }
  }

  private static async logFeatureChangeActivity(
    userId: number | undefined,
    deviceId: number,
    feature: {
      obd?: boolean;
      gps?: boolean;
      emission?: boolean;
      fuel?: boolean;
    }
  ) {
    try {
      if (userId) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'DEVICE_FEATURE_TOGGLE',
            metadata: {
              deviceId,
              changes: feature,
              timestamp: new Date()
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to log device feature change activity', error);
    }
  }

  static async getStatusHistory(deviceId: number, daysBack = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      return await prisma.activityLog.findMany({
        where: {
          action: 'DEVICE_STATUS_CHANGE',
          metadata: {
            path: ['deviceId'],
            equals: deviceId
          },
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        select: {
          id: true,
          timestamp: true,
          metadata: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError(
        'Failed to get device status history',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
