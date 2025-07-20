import { DeviceStatus, CommunicationProtocol, DeviceCategory, ConnectionStatus } from '@prisma/client';
import { DeviceFilters, TrackingDeviceRepository } from '../repositories/TrackingDeviceRepository.js';
import logger from '../utils/logger.js';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler.js';
import { errorMonitor } from 'events';
import { PaginationParams } from '../types/GlobalTypes.js';

export class TrackingDeviceService {
  // Basic CRUD Operations
  static async createDevice(data: {
    serialNumber: string;
    model: string;
    type: string;
    plateNumber: string;
    deviceCategory: DeviceCategory;
    firmwareVersion?: string;
    simCardNumber?: string;
    communicationProtocol: CommunicationProtocol;
    dataTransmissionInterval: string;
    userId?: number;
    vehicleId?: number;
  }) {
    try {
      // Validate required fields
      if (
        !data.serialNumber ||
        !data.model ||
        !data.type ||
        !data.plateNumber ||
        !data.deviceCategory
      ) {
        throw new AppError(
          "Missing required fields",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check if device with same serial number exists
const existingDevice = await TrackingDeviceRepository.findActiveDeviceBySerialNumber(data.serialNumber);

if (existingDevice) {
  throw new AppError(
    "Device with this serial number already exists",
    HttpStatusCode.CONFLICT,

  );
}


      return await TrackingDeviceRepository.createDevice({
        ...data,
        status: "INACTIVE", // Default status for new devices
      });
    } catch (error) {
      logger.error("TrackingDeviceService::createDevice", error);
      throw error;
    }
  }

  static async getDeviceById(id: number) {
    try {
      return await TrackingDeviceRepository.getDeviceById(id);
    } catch (error) {
      logger.error("TrackingDeviceService::getDeviceById", error);
      throw error;
    }
  }

  static async updateDevice(
    id: number,
    data: {
      model?: string;
      type?: string;
      plateNumber?: string;
      batteryLevel?: number;
      signalStrength?: number;
      firmwareVersion?: string;
      simCardNumber?: string;
      communicationProtocol?: CommunicationProtocol;
      dataTransmissionInterval?: string;
      enableOBDMonitoring?: boolean;
      enableGPSTracking?: boolean;
      enableEmissionMonitoring?: boolean;
      enableFuelMonitoring?: boolean;
      status?: DeviceStatus;
      userId?: number;
      vehicleId?: number | null;
    }
  ) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.updateDevice(id, data);
    } catch (error) {
      logger.error("TrackingDeviceService::updateDevice", error);
      throw error;
    }
  }

  static async softDeleteDevice(id: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.softDeleteDevice(id);
    } catch (error) {
      logger.error("TrackingDeviceService::softDeleteDevice", error);
      throw error;
    }
  }

  static async restoreDevice(id: number) {
    try {
      return await TrackingDeviceRepository.restoreDevice(id);
    } catch (error) {
      logger.error("TrackingDeviceService::restoreDevice", error);
      throw error;
    }
  }

  static async deleteDevicePermanently(id: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.deleteDevicePermanently(id);
    } catch (error) {
      logger.error("TrackingDeviceService::deleteDevicePermanently", error);
      throw error;
    }
  }

  // List and Search Operations
static async listDevices(params: PaginationParams<DeviceFilters>) {

    try {
      // Validate pagination parameters
      if (params.page && params.page < 1) {
        throw new AppError(
          "Page must be greater than 0",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (params.limit && (params.limit < 1 || params.limit > 100)) {
        throw new AppError(
          "Limit must be between 1 and 100",
          HttpStatusCode.BAD_REQUEST
        );
      }

      return await TrackingDeviceRepository.listDevices(params);
    } catch (error) {
      console.log("TrackingDeviceService::listDevices", errorMonitor);
      logger.error("TrackingDeviceService::listDevices", error);
      throw error;
    }
  }

  // Device Assignment Operations
  static async assignToVehicle(deviceId: number, vehicleId: number) {
    try {
      // Check if device exists
      const device = await TrackingDeviceRepository.getDeviceById(deviceId);

      // Check if device is already assigned to this vehicle
      if (device.vehicleId === vehicleId) {
        throw new AppError(
          "Device is already assigned to this vehicle",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check if device is active
      if (device.status !== "ACTIVE") {
        throw new AppError(
          "Only ACTIVE devices can be assigned to vehicles",
          HttpStatusCode.BAD_REQUEST
        );
      }

      return await TrackingDeviceRepository.assignToVehicle(
        deviceId,
        vehicleId
      );
    } catch (error) {
      logger.error("TrackingDeviceService::assignToVehicle", error);
      throw error;
    }
  }

  static async unassignFromVehicle(deviceId: number) {
    try {
      // Check if device exists
      const device = await TrackingDeviceRepository.getDeviceById(deviceId);

      // Check if device is already unassigned
      if (!device.vehicleId) {
        throw new AppError(
          "Device is not assigned to any vehicle",
          HttpStatusCode.BAD_REQUEST
        );
      }

      return await TrackingDeviceRepository.unassignFromVehicle(deviceId);
    } catch (error) {
      logger.error("TrackingDeviceService::unassignFromVehicle", error);
      throw error;
    }
  }

  // Status Management
  static async updateDeviceStatus(
    deviceId: number,
    newStatus: DeviceStatus,
    options: {
      force?: boolean;
      disableMonitoring?: boolean;
    } = { force: false, disableMonitoring: true }
  ) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.safelyUpdateDeviceStatus(
        deviceId,
        newStatus,
        options
      );
    } catch (error) {
      logger.error("TrackingDeviceService::updateDeviceStatus", error);
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
      if (deviceIds.length === 0) {
        throw new AppError(
          "No device IDs provided",
          HttpStatusCode.BAD_REQUEST
        );
      }

      if (deviceIds.length > 100) {
        throw new AppError(
          "Cannot update more than 100 devices at once",
          HttpStatusCode.BAD_REQUEST
        );
      }

      return await TrackingDeviceRepository.batchUpdateStatuses(
        deviceIds,
        newStatus,
        options
      );
    } catch (error) {
      logger.error("TrackingDeviceService::batchUpdateStatuses", error);
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
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.toggleMonitoringFeature(
        deviceId,
        feature,
        options
      );
    } catch (error) {
      logger.error("TrackingDeviceService::toggleMonitoringFeature", error);
      throw error;
    }
  }

  static async getMonitoringFeatures(deviceId: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.getMonitoringFeatures(deviceId);
    } catch (error) {
      logger.error("TrackingDeviceService::getMonitoringFeatures", error);
      throw error;
    }
  }

  static async resetAllMonitoringFeatures(deviceId: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.resetAllMonitoringFeatures(
        deviceId
      );
    } catch (error) {
      logger.error("TrackingDeviceService::resetAllMonitoringFeatures", error);
      throw error;
    }
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
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.recordHeartbeat(deviceId, data);
    } catch (error) {
      logger.error("TrackingDeviceService::recordHeartbeat", error);
      throw error;
    }
  }

  static async getDeviceHealth(deviceId: number, hoursBack = 24) {
    try {
      // Validate hoursBack parameter
      if (hoursBack < 1 || hoursBack > 720) {
        // 30 days max
        throw new AppError(
          "hoursBack must be between 1 and 720 (30 days)",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.getDeviceHealth(
        deviceId,
        hoursBack
      );
    } catch (error) {
      logger.error("TrackingDeviceService::getDeviceHealth", error);
      throw error;
    }
  }

  // Analytics and Reporting
  static async getTopDevicesByStatus(status: DeviceStatus, limit: number = 5) {
    try {
      if (limit < 1 || limit > 20) {
        throw new AppError(
          "Limit must be between 1 and 20",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const devices = await TrackingDeviceRepository.listDevices({
        filters: { status },
        limit,
        sortBy: "lastPing",
        sortOrder: "desc",
      });

      return devices.data;
    } catch (error) {
      logger.error("TrackingDeviceService::getTopDevicesByStatus", error);
      throw error;
    }
  }

  static async countDevicesByStatus(status?: DeviceStatus) {
    try {
      const count = await TrackingDeviceRepository.listDevices({
        filters: status ? { status } : undefined,
      });
      return count.meta.totalItems;
    } catch (error) {
      logger.error("TrackingDeviceService::countDevicesByStatus", error);
      throw error;
    }
  }

  static async getStatusHistory(deviceId: number, daysBack = 30) {
    try {
      // Validate daysBack parameter
      if (daysBack < 1 || daysBack > 365) {
        throw new AppError(
          "daysBack must be between 1 and 365",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(deviceId);

      return await TrackingDeviceRepository.getStatusHistory(
        deviceId,
        daysBack
      );
    } catch (error) {
      logger.error("TrackingDeviceService::getStatusHistory", error);
      throw error;
    }
  }

  // Utility Methods
  static async getDeviceBySerialNumber(serialNumber: string) {
    try {
      const result = await TrackingDeviceRepository.listDevices({
        search: serialNumber,
        limit: 1,
      });

      if (result.data.length === 0) {
        throw new AppError("Device not found", HttpStatusCode.NOT_FOUND);
      }

      return result.data[0];
    } catch (error) {
      logger.error("TrackingDeviceService::getDeviceBySerialNumber", error);
      throw error;
    }
  }

  static async bulkCreateDevices(
    devices: Array<{
      serialNumber: string;
      model: string;
      type: string;
      plateNumber: string;
      deviceCategory: DeviceCategory;
      firmwareVersion?: string;
      simCardNumber?: string;
      communicationProtocol: CommunicationProtocol;
      dataTransmissionInterval: string;
      userId?: number;
    }>
  ) {
    try {
      if (devices.length === 0) {
        throw new AppError("No devices provided", HttpStatusCode.BAD_REQUEST);
      }

      if (devices.length > 100) {
        throw new AppError(
          "Cannot create more than 100 devices at once",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check for duplicate serial numbers in the input
      const serialNumbers = devices.map((d) => d.serialNumber);
      if (new Set(serialNumbers).size !== serialNumbers.length) {
        throw new AppError(
          "Duplicate serial numbers in the input",
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Check if any serial numbers already exist in the database
      const existingDevices = await TrackingDeviceRepository.listDevices({
        search: serialNumbers.join(" "),
        limit: 100,
      });

      if (existingDevices.data.length > 0) {
        const existingSerials = existingDevices.data.map((d) => d.serialNumber);
        throw new AppError(
          `Devices with these serial numbers already exist: ${existingSerials.join(", ")}`,
          HttpStatusCode.CONFLICT
        );
      }

      // Create devices in a transaction
      const createdDevices = [];
      for (const device of devices) {
        const createdDevice = await TrackingDeviceRepository.createDevice({
          ...device,
          status: "INACTIVE",
        });
        createdDevices.push(createdDevice);
      }

      return createdDevices;
    } catch (error) {
      logger.error("TrackingDeviceService::bulkCreateDevices", error);
      throw error;
    }
  }
}
