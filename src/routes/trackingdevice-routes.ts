import { Router } from 'express';
import { TrackingDeviceController } from '../controllers/TrackingDeviceController';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions';
import { hasRole } from '../middlewares/hasRole';
import { UserRole } from '@prisma/client';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { catchAsync } from '../middlewares/errorHandler';

const TrackingDeviceRouter = Router();

// Device CRUD operations
TrackingDeviceRouter.post(
  '/',
  isLoggedIn,
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  catchAsync(TrackingDeviceController.createDevice)
);

TrackingDeviceRouter.get(
  '/:id',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getDeviceById)
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

// Analytics
TrackingDeviceRouter.get(
  '/analytics/top/:status',
  isLoggedIn,
  catchAsync(TrackingDeviceController.getTopDevicesByStatus)
);

TrackingDeviceRouter.get(
  '/analytics/count',
  isLoggedIn,
  catchAsync(TrackingDeviceController.countDevices)
);

export default TrackingDeviceRouter;