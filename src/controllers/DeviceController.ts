// src/controllers/DeviceController.ts (Complete implementation)
import { Request, Response as ExpressResponse } from "express";
import DeviceService from "../services/DeviceService";
import Response from "../utils/response";
import { DeviceListQueryDTO } from "../types/dtos/DeviceDto";
import { DeviceStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

class DeviceController {
  constructor() {
    this.createDevice = this.createDevice.bind(this);
    this.getDeviceById = this.getDeviceById.bind(this);
    this.updateDevice = this.updateDevice.bind(this);
    this.softDeleteDevice = this.softDeleteDevice.bind(this);
    this.hardDeleteDevice = this.hardDeleteDevice.bind(this);
    this.restoreDevice = this.restoreDevice.bind(this);
    this.assignDeviceToVehicle = this.assignDeviceToVehicle.bind(this);
    this.unassignDeviceFromVehicle = this.unassignDeviceFromVehicle.bind(this);
    this.assignDeviceToUser = this.assignDeviceToUser.bind(this);
    this.updateDeviceAssignment = this.updateDeviceAssignment.bind(this);
    this.updateDeviceConfiguration = this.updateDeviceConfiguration.bind(this);
    this.listDevices = this.listDevices.bind(this);
    this.getDeviceAnalytics = this.getDeviceAnalytics.bind(this);
    this.updateDeviceStatus = this.updateDeviceStatus.bind(this);
    this.recordDevicePing = this.recordDevicePing.bind(this);
    this.getOfflineDevices = this.getOfflineDevices.bind(this);
  }

  async createDevice(req: Request, res: ExpressResponse) {
    try {
      const device = await DeviceService.createDevice(req.body);
      return Response.created(res, device, "Device created successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Create device failed");
    }
  }

  async getDeviceById(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.getDeviceById(deviceId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(res, device, "Device retrieved successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Get device failed");
    }
  }

  async updateDevice(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.updateDevice(deviceId, req.body);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(res, device, "Device updated successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Update device failed");
    }
  }

  async softDeleteDevice(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.softDeleteDevice(deviceId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(res, device, "Device soft deleted successfully");
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Soft delete device failed"
      );
    }
  }

  async hardDeleteDevice(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.hardDeleteDevice(deviceId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(res, device, "Device hard deleted successfully");
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Hard delete device failed"
      );
    }
  }

  async restoreDevice(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.restoreDevice(deviceId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(res, device, "Device restored successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Restore device failed");
    }
  }

  async assignDeviceToVehicle(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const { vehicleId } = req.body;
      const device = await DeviceService.assignDeviceToVehicle(
        deviceId,
        vehicleId
      );
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device assigned to vehicle successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Assign device to vehicle failed"
      );
    }
  }

  async unassignDeviceFromVehicle(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.unassignDeviceFromVehicle(deviceId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device unassigned from vehicle successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Unassign device from vehicle failed"
      );
    }
  }

  async assignDeviceToUser(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const { userId } = req.body;
      const device = await DeviceService.assignDeviceToUser(deviceId, userId);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device assigned to user successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Assign device to user failed"
      );
    }
  }

  async updateDeviceAssignment(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.updateDeviceAssignment(
        deviceId,
        req.body
      );
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device assignment updated successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Update device assignment failed"
      );
    }
  }

  async updateDeviceConfiguration(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const device = await DeviceService.updateDeviceConfiguration(
        deviceId,
        req.body
      );
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device configuration updated successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Update device configuration failed"
      );
    }
  }

  async listDevices(req: Request, res: ExpressResponse) {
    try {
      const query: DeviceListQueryDTO = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        search: req.query.search as string,
        status: req.query.status as DeviceStatus,
        category: req.query.category as any,
        userId: req.query.userId ? Number(req.query.userId) : undefined,
        vehicleId: req.query.vehicleId
          ? Number(req.query.vehicleId)
          : undefined,
        isActive: req.query.isActive
          ? req.query.isActive === "true"
          : undefined,
      };

      const result = await DeviceService.listDevices(query);
      return Response.success(res, result, "Devices retrieved successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "List devices failed");
    }
  }

  async getDeviceAnalytics(req: Request, res: ExpressResponse) {
    try {
      const analytics = await DeviceService.getDeviceAnalytics();
      return Response.success(
        res,
        analytics,
        "Device analytics retrieved successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Get device analytics failed"
      );
    }
  }

  async updateDeviceStatus(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      const { status } = req.body;
      const device = await DeviceService.updateDeviceStatus(deviceId, status);
      if (!device) return Response.notFound(res, "Device");
      return Response.success(
        res,
        device,
        "Device status updated successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Update device status failed"
      );
    }
  }

  async recordDevicePing(req: Request, res: ExpressResponse) {
    try {
      const deviceId = Number(req.params.id);
      await DeviceService.recordDevicePing(deviceId);
      return Response.success(res, null, "Device ping recorded successfully");
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Record device ping failed"
      );
    }
  }

  async getOfflineDevices(req: Request, res: ExpressResponse) {
    try {
      const thresholdMinutes = req.query.threshold
        ? Number(req.query.threshold)
        : 30;
      const offlineDevices =
        await DeviceService.getOfflineDevices(thresholdMinutes);
      return Response.success(
        res,
        offlineDevices,
        "Offline devices retrieved successfully"
      );
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Get offline devices failed"
      );
    }
  }
}

export default DeviceController;
