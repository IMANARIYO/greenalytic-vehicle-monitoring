// src/services/DeviceService.ts
import { Prisma, DeviceStatus } from "@prisma/client";
import DeviceRepository from "../repositories/DeviceRepository";
import {
  CreateDeviceDTO,
  UpdateDeviceDTO,
  DeviceAssignmentDTO,
  DeviceConfigurationDTO,
  DeviceListQueryDTO,
  DeviceBasicInfo,
  DeviceWithRelations,
  DeviceListResponse,
  DeviceAnalyticsResponse,
} from "../types/dtos/DeviceDto";
import logger from "../utils/logger";
import {
  AppError,
  HttpStatusCode,
  NotFoundError,
} from "../middlewares/errorHandler";

function removeNulls<T extends object>(obj: T): T {
  const cleanedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      cleanedObj[key] = undefined;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      cleanedObj[key] = removeNulls(value);
    } else {
      cleanedObj[key] = value;
    }
  }
  return cleanedObj;
}

class DeviceService {
  async createDevice(data: CreateDeviceDTO): Promise<DeviceBasicInfo> {
    try {
      // Check if serial number already exists
      const existingDevice = await DeviceRepository.getDeviceBySerialNumber(
        data.serialNumber
      );
      if (existingDevice) {
        throw new AppError(
          "Device with this serial number already exists",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const cleanData = removeNulls(data);
      // Ensure batteryLevel is never null
      const deviceData: CreateDeviceDTO = {
        ...cleanData,
        batteryLevel:
          cleanData.batteryLevel === null ? undefined : cleanData.batteryLevel,
        userId: data.userId,
        vehicleId: data.vehicleId,
      };

      const device = await DeviceRepository.createDevice(deviceData);
      logger.info(`Device created successfully: ${device.serialNumber}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::createDevice", error);
      throw error;
    }
  }

  async getDeviceById(id: number): Promise<DeviceWithRelations | null> {
    try {
      const device = await DeviceRepository.getDeviceById(id);
      if (!device) {
        throw new NotFoundError(`Device with id ${id}`);
      }
      return device;
    } catch (error) {
      logger.error("DeviceService::getDeviceById", error);
      throw error;
    }
  }

  async updateDevice(
    id: number,
    data: UpdateDeviceDTO
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(id);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${id}`);
      }

      const cleanData = removeNulls(data);
      const device = await DeviceRepository.updateDevice(id, cleanData);
      logger.info(`Device updated successfully: ${device?.serialNumber}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::updateDevice", error);
      throw error;
    }
  }

  async softDeleteDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(id);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${id}`);
      }

      const device = await DeviceRepository.softDeleteDevice(id);
      logger.info(`Device soft deleted successfully: ${device?.serialNumber}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::softDeleteDevice", error);
      throw error;
    }
  }

  async hardDeleteDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(id);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${id}`);
      }

      const device = await DeviceRepository.hardDeleteDevice(id);
      logger.info(`Device hard deleted successfully: ${device?.serialNumber}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::hardDeleteDevice", error);
      throw error;
    }
  }

  async restoreDevice(id: number): Promise<DeviceBasicInfo | null> {
    try {
      const device = await DeviceRepository.restoreDevice(id);
      if (!device) {
        throw new NotFoundError(`Device with id ${id}`);
      }

      logger.info(`Device restored successfully: ${device.serialNumber}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::restoreDevice", error);
      throw error;
    }
  }

  async assignDeviceToVehicle(
    deviceId: number,
    vehicleId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const device = await DeviceRepository.assignDeviceToVehicle(
        deviceId,
        vehicleId
      );
      logger.info(
        `Device ${device?.serialNumber} assigned to vehicle ${vehicleId}`
      );
      return device;
    } catch (error) {
      logger.error("DeviceService::assignDeviceToVehicle", error);
      throw error;
    }
  }

  async unassignDeviceFromVehicle(
    deviceId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const device = await DeviceRepository.unassignDeviceFromVehicle(deviceId);
      logger.info(`Device ${device?.serialNumber} unassigned from vehicle`);
      return device;
    } catch (error) {
      logger.error("DeviceService::unassignDeviceFromVehicle", error);
      throw error;
    }
  }

  async assignDeviceToUser(
    deviceId: number,
    userId: number
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const device = await DeviceRepository.assignDeviceToUser(
        deviceId,
        userId
      );
      logger.info(`Device ${device?.serialNumber} assigned to user ${userId}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::assignDeviceToUser", error);
      throw error;
    }
  }

  async updateDeviceAssignment(
    deviceId: number,
    data: DeviceAssignmentDTO
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const updateData: Prisma.TrackingDeviceUpdateInput = {
        user: data.userId
          ? { connect: { id: data.userId } }
          : { disconnect: true },
        vehicle: data.vehicleId
          ? { connect: { id: data.vehicleId } }
          : { disconnect: true },
      };

      const device = await DeviceRepository.updateDevice(deviceId, updateData);
      logger.info(`Device ${device?.serialNumber} assignment updated`);
      return device;
    } catch (error) {
      logger.error("DeviceService::updateDeviceAssignment", error);
      throw error;
    }
  }

  async updateDeviceConfiguration(
    deviceId: number,
    data: DeviceConfigurationDTO
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const device = await DeviceRepository.updateDevice(deviceId, data);
      logger.info(`Device ${device?.serialNumber} configuration updated`);
      return device;
    } catch (error) {
      logger.error("DeviceService::updateDeviceConfiguration", error);
      throw error;
    }
  }

  async listDevices(query: DeviceListQueryDTO): Promise<DeviceListResponse> {
    try {
      const result = await DeviceRepository.getAllDevices(query);
      return result;
    } catch (error) {
      logger.error("DeviceService::listDevices", error);
      throw error;
    }
  }

  async getDeviceAnalytics(): Promise<DeviceAnalyticsResponse> {
    try {
      const analytics = await DeviceRepository.getDeviceAnalytics();
      return analytics;
    } catch (error) {
      logger.error("DeviceService::getDeviceAnalytics", error);
      throw error;
    }
  }

  async updateDeviceStatus(
    deviceId: number,
    status: DeviceStatus
  ): Promise<DeviceBasicInfo | null> {
    try {
      const existingDevice = await DeviceRepository.getDeviceById(deviceId);
      if (!existingDevice) {
        throw new NotFoundError(`Device with id ${deviceId}`);
      }

      const device = await DeviceRepository.updateDevice(deviceId, { status });
      logger.info(`Device ${device?.serialNumber} status updated to ${status}`);
      return device;
    } catch (error) {
      logger.error("DeviceService::updateDeviceStatus", error);
      throw error;
    }
  }

  async recordDevicePing(deviceId: number): Promise<void> {
    try {
      await DeviceRepository.updateLastPing(deviceId);
      logger.info(`Device ${deviceId} ping recorded`);
    } catch (error) {
      logger.error("DeviceService::recordDevicePing", error);
      throw error;
    }
  }

  async getOfflineDevices(
    thresholdMinutes: number = 30
  ): Promise<DeviceBasicInfo[]> {
    try {
      const offlineDevices =
        await DeviceRepository.getOfflineDevices(thresholdMinutes);
      return offlineDevices;
    } catch (error) {
      logger.error("DeviceService::getOfflineDevices", error);
      throw error;
    }
  }
}

export default new DeviceService();
