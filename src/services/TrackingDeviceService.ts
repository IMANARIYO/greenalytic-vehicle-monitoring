import { DeviceStatus, CommunicationProtocol, DeviceCategory } from '@prisma/client';
import { TrackingDeviceRepository } from '../repositories/TrackingDeviceRepository';
import logger from '../utils/logger';
import { AppError, HttpStatusCode } from '../middlewares/errorHandler';

export class TrackingDeviceService {
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
      if (!data.serialNumber || !data.model || !data.type || !data.plateNumber || !data.deviceCategory) {
        throw new AppError('Missing required fields', HttpStatusCode.BAD_REQUEST);
      }

      // Check if device with same serial number exists
      const existingDevice = await TrackingDeviceRepository.listDevices({
        filters: { status: 'ACTIVE' },
        search: data.serialNumber,
        limit: 1
      });

      if (existingDevice.data.length > 0) {
        throw new AppError('Device with this serial number already exists', HttpStatusCode.CONFLICT);
      }

      return await TrackingDeviceRepository.createDevice(data);
    } catch (error) {
      logger.error('TrackingDeviceService::createDevice', error);
      throw error;
    }
  }

  static async getDeviceById(id: number) {
    try {
      return await TrackingDeviceRepository.getDeviceById(id);
    } catch (error) {
      logger.error('TrackingDeviceService::getDeviceById', error);
      throw error;
    }
  }

  static async updateDevice(id: number, data: {
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
  }) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.updateDevice(id, data);
    } catch (error) {
      logger.error('TrackingDeviceService::updateDevice', error);
      throw error;
    }
  }

  static async softDeleteDevice(id: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.softDeleteDevice(id);
    } catch (error) {
      logger.error('TrackingDeviceService::softDeleteDevice', error);
      throw error;
    }
  }

  static async restoreDevice(id: number) {
    try {
      return await TrackingDeviceRepository.restoreDevice(id);
    } catch (error) {
      logger.error('TrackingDeviceService::restoreDevice', error);
      throw error;
    }
  }

  static async deleteDevicePermanently(id: number) {
    try {
      // Check if device exists
      await TrackingDeviceRepository.getDeviceById(id);

      return await TrackingDeviceRepository.deleteDevicePermanently(id);
    } catch (error) {
      logger.error('TrackingDeviceService::deleteDevicePermanently', error);
      throw error;
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
      // Validate pagination parameters
      if (params.page && params.page < 1) {
        throw new AppError('Page must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      if (params.limit && (params.limit < 1 || params.limit > 100)) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      return await TrackingDeviceRepository.listDevices(params);
    } catch (error) {
      logger.error('TrackingDeviceService::listDevices', error);
      throw error;
    }
  }

  static async assignToVehicle(deviceId: number, vehicleId: number) {
    try {
      // Check if device exists
      const device = await TrackingDeviceRepository.getDeviceById(deviceId);

      // Check if device is already assigned to this vehicle
      if (device.vehicleId === vehicleId) {
        throw new AppError('Device is already assigned to this vehicle', HttpStatusCode.BAD_REQUEST);
      }

      return await TrackingDeviceRepository.assignToVehicle(deviceId, vehicleId);
    } catch (error) {
      logger.error('TrackingDeviceService::assignToVehicle', error);
      throw error;
    }
  }

  static async unassignFromVehicle(deviceId: number) {
    try {
      // Check if device exists
      const device = await TrackingDeviceRepository.getDeviceById(deviceId);

      // Check if device is already unassigned
      if (!device.vehicleId) {
        throw new AppError('Device is not assigned to any vehicle', HttpStatusCode.BAD_REQUEST);
      }

      return await TrackingDeviceRepository.unassignFromVehicle(deviceId);
    } catch (error) {
      logger.error('TrackingDeviceService::unassignFromVehicle', error);
      throw error;
    }
  }

  static async getTopDevicesByStatus(status: DeviceStatus, limit: number = 5) {
    try {
      if (limit < 1 || limit > 20) {
        throw new AppError('Limit must be between 1 and 20', HttpStatusCode.BAD_REQUEST);
      }

      const devices = await TrackingDeviceRepository.listDevices({
        filters: { status },
        limit,
        sortBy: 'lastPing',
        sortOrder: 'desc'
      });

      return devices.data;
    } catch (error) {
      logger.error('TrackingDeviceService::getTopDevicesByStatus', error);
      throw error;
    }
  }

  static async countDevicesByStatus(status?: DeviceStatus) {
    try {
      const count = await TrackingDeviceRepository.listDevices({
        filters: status ? { status } : undefined
      });
      return count.meta.totalItems;
    } catch (error) {
      logger.error('TrackingDeviceService::countDevicesByStatus', error);
      throw error;
    }
  }
}