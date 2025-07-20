import { Router } from 'express';
import { TrackingDeviceController } from '../controllers/TrackingDeviceController.js';
import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { hasRole } from '../middlewares/hasRole.js';
import { UserRole } from '@prisma/client';
import { catchAsync } from '../middlewares/errorHandler.js';

const TrackingDeviceRouter = Router();

// Device CRUD operations
TrackingDeviceRouter.post(
  '/',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.createDevice)
);

TrackingDeviceRouter.post(
  '/bulk',
  isLoggedIn,
  hasRole([UserRole.ADMIN]),
  catchAsync(TrackingDeviceController.bulkCreateDevices)
);

TrackingDeviceRouter.get(
  '/:id',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getDeviceById)
);

TrackingDeviceRouter.get(
  '/serial/:serialNumber',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getDeviceBySerialNumber)
);

TrackingDeviceRouter.put(
  '/:id',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.updateDevice)
);

TrackingDeviceRouter.patch(
  '/:id/soft-delete',
  isLoggedIn,
  hasRole([UserRole.ADMIN]),
  catchAsync(TrackingDeviceController.softDeleteDevice)
);

TrackingDeviceRouter.patch(
  '/:id/restore',
  isLoggedIn,
  hasRole([UserRole.ADMIN]),
  catchAsync(TrackingDeviceController.restoreDevice)
);

TrackingDeviceRouter.delete(
  '/:id',
  isLoggedIn,
  hasRole([UserRole.ADMIN]),
  catchAsync(TrackingDeviceController.deleteDevicePermanently)
);

// Device listing and filtering
TrackingDeviceRouter.get(
  '/',
  isLoggedIn,
  catchAsync(TrackingDeviceController.listDevices)
);

// Device assignment
TrackingDeviceRouter.patch(
  '/:deviceId/assign/:vehicleId',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.assignToVehicle)
);

TrackingDeviceRouter.patch(
  '/:deviceId/unassign',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.unassignFromVehicle)
);

// Status management
TrackingDeviceRouter.patch(
  '/:deviceId/status',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.updateDeviceStatus)
);

TrackingDeviceRouter.post(
  '/batch/status',
  isLoggedIn,
  hasRole([UserRole.ADMIN]),
  catchAsync(TrackingDeviceController.batchUpdateStatuses)
);

// Monitoring features
TrackingDeviceRouter.patch(
  '/:deviceId/monitoring-features',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.toggleMonitoringFeature)
);

TrackingDeviceRouter.get(
  '/:deviceId/monitoring-features',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getMonitoringFeatures)
);

TrackingDeviceRouter.patch(
  '/:deviceId/reset-monitoring-features',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.resetAllMonitoringFeatures)
);

// Heartbeat and health
TrackingDeviceRouter.post(
  '/:deviceId/heartbeat',
  catchAsync(TrackingDeviceController.recordHeartbeat)
);

TrackingDeviceRouter.get(
  '/:deviceId/health',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getDeviceHealth)
);

// Analytics and reporting
TrackingDeviceRouter.get(
  '/analytics/top/:status',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getTopDevicesByStatus)
);

TrackingDeviceRouter.get(
  '/analytics/count',
  isLoggedIn,
  catchAsync(TrackingDeviceController.countDevicesByStatus)
);

TrackingDeviceRouter.get(
  '/:deviceId/history/status',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getStatusHistory)
);

export default TrackingDeviceRouter;