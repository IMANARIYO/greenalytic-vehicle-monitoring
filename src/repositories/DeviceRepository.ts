// src/repositories/DeviceRepository.ts
import {
  Prisma,
  TrackingDevice,
  DeviceStatus,
  DeviceCategory,
} from "@prisma/client";
import prisma from "../config/db";
import {
  DeviceListQueryDTO,
  DeviceBasicInfo,
  DeviceWithRelations,
  DeviceListResponse,
  DeviceAnalyticsResponse,
  CreateDeviceDTO,
  UpdateDeviceDTO,
} from "../types/dtos/DeviceDto";
import { PaginationMeta } from "../types/GrobalTypes";
import logger from "../utils/logger";

class DeviceRepository {
  async createDevice(data: CreateDeviceDTO): Promise<DeviceBasicInfo> {
    try {
      const { userId, vehicleId, ...restData } = data;
      const device = await prisma.trackingDevice.create({
        data: {
          ...restData,
          deviceCategory: data.deviceCategory,
          status: data.status ?? DeviceStatus.ACTIVE,
          isActive: data.isActive ?? true,
          user: userId ? { connect: { id: userId } } : undefined,
          vehicle: vehicleId ? { connect: { id: vehicleId } } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              companyName: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              vehicleType: true,
              vehicleModel: true,
              status: true,
            },
          },
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::createDevice", error);
      throw error;
    }
  }

  async getDeviceById(id: number): Promise<DeviceWithRelations | null> {
    try {
      const device = await prisma.trackingDevice.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              companyName: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              vehicleType: true,
              vehicleModel: true,
              status: true,
            },
          },
          _count: {
            select: {
              gpsData: true,
              fuelData: true,
              emissionData: true,
              obdData: true,
            },
          },
        },
      });
      return device as DeviceWithRelations | null;
    } catch (error) {
      logger.error("DeviceRepository::getDeviceById", error);
      throw error;
    }
  }

  async getDeviceBySerialNumber(
    serialNumber: string
  ): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.findFirst({
        where: {
          serialNumber,
          deletedAt: null,
        },
      });
      return device as DeviceBasicInfo | null;
    } catch (error) {
      logger.error("DeviceRepository::getDeviceBySerialNumber", error);
      throw error;
    }
  }

  async updateDevice(
    id: number,
    data: Prisma.TrackingDeviceUpdateInput
  ): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::updateDevice", error);
      throw error;
    }
  }

  async softDeleteDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          status: DeviceStatus.INACTIVE,
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::softDeleteDevice", error);
      throw error;
    }
  }

  async hardDeleteDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.delete({
        where: { id },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::hardDeleteDevice", error);
      throw error;
    }
  }

  async restoreDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id },
        data: {
          deletedAt: null,
          isActive: true,
          status: DeviceStatus.ACTIVE,
          updatedAt: new Date(),
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::restoreDevice", error);
      throw error;
    }
  }

  async assignDeviceToVehicle(
    deviceId: number,
    vehicleId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: {
          vehicleId,
          updatedAt: new Date(),
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::assignDeviceToVehicle", error);
      throw error;
    }
  }

  async unassignDeviceFromVehicle(
    deviceId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: {
          vehicleId: null,
          updatedAt: new Date(),
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::unassignDeviceFromVehicle", error);
      throw error;
    }
  }

  async assignDeviceToUser(
    deviceId: number,
    userId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const device = await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: {
          userId,
          updatedAt: new Date(),
        },
      });
      return device as DeviceBasicInfo;
    } catch (error) {
      logger.error("DeviceRepository::assignDeviceToUser", error);
      throw error;
    }
  }

  async getAllDevices(query: DeviceListQueryDTO): Promise<DeviceListResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        category,
        userId,
        vehicleId,
        isActive,
      } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.TrackingDeviceWhereInput = {
        deletedAt: null,
        ...(search && {
          OR: [
            { serialNumber: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { type: { contains: search, mode: "insensitive" } },
            { plateNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
        ...(category && { deviceCategory: category }),
        ...(userId && { userId }),
        ...(vehicleId && { vehicleId }),
        ...(isActive !== undefined && { isActive }),
      };

      const [devices, total] = await Promise.all([
        prisma.trackingDevice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                companyName: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                vehicleType: true,
                vehicleModel: true,
                status: true,
              },
            },
            _count: {
              select: {
                gpsData: true,
                fuelData: true,
                emissionData: true,
                obdData: true,
              },
            },
          },
        }),
        prisma.trackingDevice.count({ where }),
      ]);

      return {
        devices: devices as DeviceWithRelations[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("DeviceRepository::getAllDevices", error);
      throw error;
    }
  }

  async getDeviceAnalytics(): Promise<DeviceAnalyticsResponse> {
    try {
      const [
        totalDevices,
        onlineDevices,
        offlineDevices,
        faultyDevices,
        devicesByCategory,
        devicesByStatus,
      ] = await Promise.all([
        prisma.trackingDevice.count({
          where: { deletedAt: null },
        }),
        prisma.trackingDevice.count({
          where: {
            deletedAt: null,
            isActive: true,
            status: DeviceStatus.ACTIVE,
          },
        }),
        prisma.trackingDevice.count({
          where: {
            deletedAt: null,
            OR: [{ status: DeviceStatus.DISCONNECTED }, { isActive: false }],
          },
        }),
        prisma.trackingDevice.count({
          where: {
            deletedAt: null,
            status: DeviceStatus.MAINTENANCE,
          },
        }),
        prisma.trackingDevice.groupBy({
          by: ["deviceCategory"],
          _count: true,
          where: { deletedAt: null },
        }),
        prisma.trackingDevice.groupBy({
          by: ["status"],
          _count: true,
          where: { deletedAt: null },
        }),
      ]);

      return {
        totalDevices,
        onlineDevices,
        offlineDevices,
        faultyDevices,
        devicesByCategory: devicesByCategory.map((item) => ({
          category: item.deviceCategory,
          count: item._count,
        })),
        devicesByStatus: devicesByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
      };
    } catch (error) {
      logger.error("DeviceRepository::getDeviceAnalytics", error);
      throw error;
    }
  }

  async updateLastPing(deviceId: number): Promise<void> {
    try {
      await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: {
          lastPing: new Date(),
          status: DeviceStatus.ACTIVE,
        },
      });
    } catch (error) {
      logger.error("DeviceRepository::updateLastPing", error);
      throw error;
    }
  }

  async getOfflineDevices(
    thresholdMinutes: number = 30
  ): Promise<DeviceBasicInfo[]> {
    try {
      const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
      const devices = await prisma.trackingDevice.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ lastPing: { lt: threshold } }, { lastPing: null }],
        },
      });
      return devices as DeviceBasicInfo[];
    } catch (error) {
      logger.error("DeviceRepository::getOfflineDevices", error);
      throw error;
    }
  }
}

export default new DeviceRepository();
