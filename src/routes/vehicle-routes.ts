import { Router, Request, Response } from 'express';
import VehicleController from '../controllers/VehicleController';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions';
import { hasRole } from '../middlewares/hasRole';
import { UserRole } from '@prisma/client';
import { isLoggedIn } from '../middlewares/isLoggedIn';


const VehiclesRouter = Router();


VehiclesRouter.post(
  '/',
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.createVehicle(req, res);
  }
);
VehiclesRouter.put(
  '/:id',
  hasRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]),
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.updateVehicle(req, res);
  }
);


VehiclesRouter.patch(
  '/:id/soft-delete',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.softDeleteVehicle(req, res);
  }
);

VehiclesRouter.patch(
  '/:id/restore',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.restoreVehicle(req, res);
  }
);


VehiclesRouter.delete(
  '/:id',
  hasRole([UserRole.ADMIN]),
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.deleteVehiclePermanently(req, res);
  }
);

VehiclesRouter.get(
  '/:id',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.getVehicleById(req, res);
  }
);


VehiclesRouter.get(
  '/',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.listVehicles(req, res);
  }
);

VehiclesRouter.get(
  '/user/:userId',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.getVehiclesByUser(req, res);
  }
);

VehiclesRouter.get(
  '/analytics/top-polluters',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.getTopPolluters(req, res);
  }
);

VehiclesRouter.get(
  '/analytics/count',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.countVehicles(req, res);
  }
);


VehiclesRouter.get(
  '/analytics/count/:status',
isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    VehicleController.countVehiclesByStatus(req, res);
  }
);

export default VehiclesRouter;