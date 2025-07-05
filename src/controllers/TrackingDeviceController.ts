import { Request, Response as ExpressResponse } from 'express';
import { TrackingDeviceService } from '../services/TrackingDeviceService';
import Response from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../utils/jwtFunctions';

export class TrackingDeviceController {
  static async createDevice(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const device = await TrackingDeviceService.createDevice(req.body);
      return Response.created(res, device, 'Device created successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::createDevice', error);
      return Response.error(res, error);
    }
  }

  static async getDeviceById(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const device = await TrackingDeviceService.getDeviceById(id);
      return Response.success(res, device, 'Device details fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getDeviceById', error);
      return Response.error(res, error);
    }
  }

  static async updateDevice(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const updatedDevice = await TrackingDeviceService.updateDevice(id, req.body);
      return Response.success(res, updatedDevice, 'Device updated successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::updateDevice', error);
      return Response.error(res, error);
    }
  }

  static async softDeleteDevice(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.softDeleteDevice(id);
      return Response.success(res, null, 'Device soft deleted');
    } catch (error) {
      logger.error('TrackingDeviceController::softDeleteDevice', error);
      return Response.error(res, error);
    }
  }

  static async restoreDevice(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.restoreDevice(id);
      return Response.success(res, null, 'Device restored');
    } catch (error) {
      logger.error('TrackingDeviceController::restoreDevice', error);
      return Response.error(res, error);
    }
  }

  static async deleteDevicePermanently(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await TrackingDeviceService.deleteDevicePermanently(id);
      return Response.success(res, null, 'Device permanently deleted');
    } catch (error) {
      logger.error('TrackingDeviceController::deleteDevicePermanently', error);
      return Response.error(res, error);
    }
  }

  static async listDevices(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        filters: {
          status: req.query.status as any,
          deviceCategory: req.query.deviceCategory as any,
          protocol: req.query.protocol as any,
          userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
          vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
        },
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      const result = await TrackingDeviceService.listDevices(params);
      return Response.success(res, result, 'Devices listed successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::listDevices', error);
      return Response.error(res, error);
    }
  }

  static async assignToVehicle(req: AuthenticatedRequest, res:ExpressResponse) {
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

  static async unassignFromVehicle(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const deviceId = parseInt(req.params.deviceId);
      const device = await TrackingDeviceService.unassignFromVehicle(deviceId);
      return Response.success(res, device, 'Device unassigned successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::unassignFromVehicle', error);
      return Response.error(res, error);
    }
  }

  static async getTopDevicesByStatus(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const status = req.params.status as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const devices = await TrackingDeviceService.getTopDevicesByStatus(status, limit);
      return Response.success(res, devices, 'Top devices by status fetched');
    } catch (error) {
      logger.error('TrackingDeviceController::getTopDevicesByStatus', error);
      return Response.error(res, error);
    }
  }

  static async countDevices(req: AuthenticatedRequest, res:ExpressResponse) {
    try {
      const status = req.query.status as any;
      const count = await TrackingDeviceService.countDevicesByStatus(status);
      return Response.success(res, { count }, 'Devices counted successfully');
    } catch (error) {
      logger.error('TrackingDeviceController::countDevices', error);
      return Response.error(res, error);
    }
  }
}