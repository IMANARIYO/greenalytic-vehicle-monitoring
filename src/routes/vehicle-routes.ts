import { Router, Request, Response, NextFunction } from 'express';
import VehicleController from '../controllers/VehicleController.js';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions.js';
import { hasRole } from '../middlewares/hasRole.js';
import { UserRole } from '@prisma/client';
import { isLoggedIn } from '../middlewares/isLoggedIn.js';

const VehiclesRouter = Router();

VehiclesRouter.post(
  '/',
  // hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.createVehicle(req, res, next);
  }
);

VehiclesRouter.put(
  '/:id',
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.updateVehicle(req, res, next);
  }
);

VehiclesRouter.patch(
  '/:id/soft-delete',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.softDeleteVehicle(req, res, next);
  }
);

VehiclesRouter.patch(
  '/:id/restore',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.restoreVehicle(req, res, next);
  }
);

VehiclesRouter.delete(
  '/:id',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.deleteVehiclePermanently(req, res, next);
  }
);

VehiclesRouter.get(
  '/:id',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.getVehicleById(req, res, next);
  }
);

VehiclesRouter.get(
  '/',
  // isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.listVehicles(req, res, next);
  }
);

VehiclesRouter.get(
  '/user/:userId',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.getVehiclesByUser(req, res, next);
  }
);

VehiclesRouter.get(
  '/analytics/top-polluters',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.getTopPolluters(req, res, next);
  }
);

VehiclesRouter.get(
  '/analytics/count',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.countVehicles(req, res, next);
  }
);

VehiclesRouter.get(
  '/analytics/count/:status',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    VehicleController.countVehiclesByStatus(req, res, next);
  }
);

export default VehiclesRouter;