// src/routes/deviceRoutes.ts
import { Router, Response } from "express";
import DeviceController from "../controllers/DeviceController";
import { hasRole } from "../middlewares/hasRole";
import { AuthenticatedRequest } from "../utils/jwtFunctions";
import { isLoggedIn } from "../middlewares/isLoggedIn";

export const DeviceRouter = Router();
const deviceController = new DeviceController();

// Create device - Admin only
DeviceRouter.post(
  "",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.createDevice(req, res);
  }
);

// Get all devices with filters and pagination
DeviceRouter.get(
  "",
  hasRole([
    "ADMIN",
    "TECHNICIAN",
    "MANAGER",
    "FLEET_MANAGER",
    "ANALYST",
    "SUPPORT_AGENT",
  ]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.listDevices(req, res);
  }
);

// Get device analytics
DeviceRouter.get(
  "/analytics",
  hasRole(["ADMIN", "MANAGER", "FLEET_MANAGER", "ANALYST"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.getDeviceAnalytics(req, res);
  }
);

// Get offline devices
DeviceRouter.get(
  "/offline",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER", "SUPPORT_AGENT"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.getOfflineDevices(req, res);
  }
);

// Get device by ID
DeviceRouter.get(
  "/:id",
  hasRole([
    "ADMIN",
    "USER",
    "TECHNICIAN",
    "MANAGER",
    "FLEET_MANAGER",
    "ANALYST",
    "SUPPORT_AGENT",
  ]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.getDeviceById(req, res);
  }
);

// Update device
DeviceRouter.put(
  "/:id",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.updateDevice(req, res);
  }
);

// Soft delete device
DeviceRouter.delete(
  "/:id/soft",
  hasRole(["ADMIN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.softDeleteDevice(req, res);
  }
);

// Hard delete device - Admin only
DeviceRouter.delete(
  "/:id/hard",
  hasRole(["ADMIN"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.hardDeleteDevice(req, res);
  }
);

// Restore device
DeviceRouter.put(
  "/:id/restore",
  hasRole(["ADMIN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.restoreDevice(req, res);
  }
);

// Assign device to vehicle
DeviceRouter.put(
  "/:id/assign-vehicle",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.assignDeviceToVehicle(req, res);
  }
);

// Unassign device from vehicle
DeviceRouter.put(
  "/:id/unassign-vehicle",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.unassignDeviceFromVehicle(req, res);
  }
);

// Assign device to user
DeviceRouter.put(
  "/:id/assign-user",
  hasRole(["ADMIN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.assignDeviceToUser(req, res);
  }
);

// Update device assignment (both user and vehicle)
DeviceRouter.put(
  "/:id/assignment",
  hasRole(["ADMIN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.updateDeviceAssignment(req, res);
  }
);

// Update device configuration
DeviceRouter.put(
  "/:id/configuration",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.updateDeviceConfiguration(req, res);
  }
);

// Update device status
DeviceRouter.put(
  "/:id/status",
  hasRole(["ADMIN", "TECHNICIAN", "MANAGER", "FLEET_MANAGER"]),
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.updateDeviceStatus(req, res);
  }
);

// Record device ping (for device heartbeat)
DeviceRouter.post(
  "/:id/ping",
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    deviceController.recordDevicePing(req, res);
  }
);

export default DeviceRouter;
