import { Response as ExpressResponse } from 'express';
import { TrackingDeviceService } from '../services/TrackingDeviceService.js';
import Response from '../utils/response.js';
import logger from '../utils/logger.js';
import { AuthenticatedRequest } from '../utils/jwtFunctions.js';
import { DeviceStatus, ConnectionStatus, CommunicationProtocol, DeviceCategory } from '@prisma/client';
import { DeviceFilters } from '../repositories/TrackingDeviceRepository.js';
import { PaginationParams } from '../types/GlobalTypes.js';
import { parseBoolean, parseNumber } from '../queryUtils.js';

export class TrackingDeviceController {
  // Basic CRUD Operations
  static async createDevice(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const device = await TrackingDeviceService.createDevice(req.body);
      return Response.created(res, device, 'Device created successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::createDevice', error);
      return Response.error(res, error);
    }
  }

  static async getDeviceById(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const device = await TrackingDeviceService.getDeviceById(id);
      return Response.success(res, device, 'Device details fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getDeviceById', error);
      return Response.error(res, error);
    }
  }

  static async updateDevice(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const updatedDevice = await TrackingDeviceService.updateDevice(id, req.body);
      return Response.success(res, updatedDevice, 'Device updated successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::updateDevice', error);
      return Response.error(res, error);
    }
  }

  static async softDeleteDevice(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.softDeleteDevice(id);
      return Response.success(res, null, 'Device soft deleted');
    } catch (error) {
      logger.error('TrackingDeviceController::softDeleteDevice', error);
      return Response.error(res, error);
    }
  }

  static async restoreDevice(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.restoreDevice(id);
      return Response.success(res, null, 'Device restored');
    } catch (error) {
      logger.error('TrackingDeviceController::restoreDevice', error);
      return Response.error(res, error);
    }
  }

  static async deleteDevicePermanently(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.deleteDevicePermanently(id);
      return Response.success(res, null, 'Device permanently deleted');
    } catch (error) {
      logger.error('TrackingDeviceController::deleteDevicePermanently', error);
      return Response.error(res, error);
    }
  }

  // List and Search Operations
  static async listDevices(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
const params: PaginationParams<DeviceFilters> = {
  page: Number(req.query.page),
  limit: Number(req.query.limit),
  search: req.query.search as string,
  sortBy: (req.query.sortBy as string) || "createdAt",
  sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
  includeDeleted: parseBoolean(req.query.includeDeleted),
  deletedOnly: parseBoolean(req.query.deletedOnly),
  filters: {
    status: req.query["filters[status]"] as DeviceStatus,
    deviceCategory: req.query["filters[deviceCategory]"] as DeviceCategory,
    protocol: req.query["filters[protocol]"] as CommunicationProtocol,
    userId: Number(req.query["filters[userId]"]),
    vehicleId: Number(req.query["filters[vehicleId]"])
  }
};


      const result = await TrackingDeviceService.listDevices(params);
      return Response.success(res, result, 'Devices listed successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::listDevices', error);
      return Response.error(res, error);
    }
  }

  // Device Assignment Operations
  static async assignToVehicle(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const vehicleId = parseInt(req.params.vehicleId);
      const device = await TrackingDeviceService.assignToVehicle(deviceId, vehicleId);
      return Response.success(res, device, 'Device assigned to vehicle successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::assignToVehicle', error);
      return Response.error(res, error);
    }
  }

  static async unassignFromVehicle(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const device = await TrackingDeviceService.unassignFromVehicle(deviceId);
      return Response.success(res, device, 'Device unassigned successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::unassignFromVehicle', error);
      return Response.error(res, error);
    }
  }

  // Status Management
  static async updateDeviceStatus(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const newStatus = req.body.status as DeviceStatus;
      const options = {
        force: req.body.force === true,
        disableMonitoring: req.body.disableMonitoring !== false
      };

      const device = await TrackingDeviceService.updateDeviceStatus(
        deviceId,
        newStatus,
        options
      );
      return Response.success(res, device, 'Device status updated successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::updateDeviceStatus', error);
      return Response.error(res, error);
    }
  }

  static async batchUpdateStatuses(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceIds = req.body.deviceIds as number[];
      const newStatus = req.body.status as DeviceStatus;
      const options = {
        force: req.body.force === true,
        disableMonitoring: req.body.disableMonitoring !== false
      };

      const result = await TrackingDeviceService.batchUpdateStatuses(
        deviceIds,
        newStatus,
        options
      );
      return Response.success(res, result, 'Batch status update completed');
    } catch (error) {
      logger.error('TrackingDeviceController::batchUpdateStatuses', error);
      return Response.error(res, error);
    }
  }

  // Monitoring Feature Control
  static async toggleMonitoringFeature(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
    const { obd, gps, emission, fuel, ignoreStatusCheck } = req.body;

      const options = {
        ignoreStatusCheck: req.body.ignoreStatusCheck === true
      };
    const feature = { obd, gps, emission, fuel };
      const device = await TrackingDeviceService.toggleMonitoringFeature(
        deviceId,
        feature,
        options
      );
      return Response.success(res, device, 'Monitoring feature updated successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::toggleMonitoringFeature', error);
      return Response.error(res, error);
    }
  }

  static async getMonitoringFeatures(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const features = await TrackingDeviceService.getMonitoringFeatures(deviceId);
      return Response.success(res, features, 'Monitoring features fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getMonitoringFeatures', error);
      return Response.error(res, error);
    }
  }

  static async resetAllMonitoringFeatures(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const device = await TrackingDeviceService.resetAllMonitoringFeatures(deviceId);
      return Response.success(res, device, 'All monitoring features reset');
    } catch (error) {
      logger.error('TrackingDeviceController::resetAllMonitoringFeatures', error);
      return Response.error(res, error);
    }
  }

  // Heartbeat and Connection Management
  static async recordHeartbeat(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const data = {
        batteryLevel: req.body.batteryLevel,
        signalStrength: req.body.signalStrength,
        status: req.body.status as ConnectionStatus
      };

      const heartbeat = await TrackingDeviceService.recordHeartbeat(deviceId, data);
      return Response.success(res, heartbeat, 'Heartbeat recorded');
    } catch (error) {
      logger.error('TrackingDeviceController::recordHeartbeat', error);
      return Response.error(res, error);
    }
  }

  static async getDeviceHealth(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const hoursBack = req.query.hoursBack ? parseInt(req.query.hoursBack as string) : 24;
      const health = await TrackingDeviceService.getDeviceHealth(deviceId, hoursBack);
      return Response.success(res, health, 'Device health report generated');
    } catch (error) {
      logger.error('TrackingDeviceController::getDeviceHealth', error);
      return Response.error(res, error);
    }
  }

  // Analytics and Reporting
  static async getTopDevicesByStatus(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const status = req.params.status as DeviceStatus;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const devices = await TrackingDeviceService.getTopDevicesByStatus(status, limit);
      return Response.success(res, devices, 'Top devices by status fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getTopDevicesByStatus', error);
      return Response.error(res, error);
    }
  }

  static async countDevicesByStatus(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const status = req.query.status as DeviceStatus | undefined;
      const count = await TrackingDeviceService.countDevicesByStatus(status);
      return Response.success(res, { count }, 'Devices counted successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::countDevicesByStatus', error);
      return Response.error(res, error);
    }
  }

  static async getStatusHistory(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : 30;
      const history = await TrackingDeviceService.getStatusHistory(deviceId, daysBack);
      return Response.success(res, history, 'Status history fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getStatusHistory', error);
      return Response.error(res, error);
    }
  }

  // Utility Methods
  static async getDeviceBySerialNumber(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const serialNumber = req.params.serialNumber as string;
      const device = await TrackingDeviceService.getDeviceBySerialNumber(serialNumber);
      return Response.success(res, device, 'Device fetched by serial number');
    } catch (error) {
      logger.error('TrackingDeviceController::getDeviceBySerialNumber', error);
      return Response.error(res, error);
    }
  }

  static async bulkCreateDevices(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const devices = req.body.devices as Array<{
        serialNumber: string;
        model: string;
        type: string;
        plateNumber: string;
        deviceCategory: any;
        firmwareVersion?: string;
        simCardNumber?: string;
        communicationProtocol: any;
        dataTransmissionInterval: string;
        userId?: number;
      }>;

      const createdDevices = await TrackingDeviceService.bulkCreateDevices(devices);
      return Response.created(res, createdDevices, 'Devices created in bulk');
    } catch (error) {
      logger.error('TrackingDeviceController::bulkCreateDevices', error);
      return Response.error(res, error);
    }
  }
}