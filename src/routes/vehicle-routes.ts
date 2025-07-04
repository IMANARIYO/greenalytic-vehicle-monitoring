import { Router, Request, Response } from 'express';
import VehicleController from '../controllers/VehicleController';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
// import { isLoggedIn, hasRole } from '../middlewares/auth'; // (Optional if you need)

const VehiclesRouter = Router();

// CREATE
VehiclesRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.createVehicle(req, res);
});

// UPDATE
VehiclesRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.updateVehicle(req, res);
});

// SOFT DELETE
VehiclesRouter.patch('/:id/soft-delete', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.softDeleteVehicle(req, res);
});

// RESTORE
VehiclesRouter.patch('/:id/restore', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.restoreVehicle(req, res);
});

// PERMANENT DELETE
VehiclesRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.deleteVehiclePermanently(req, res);
});

// GET BY ID
VehiclesRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.getVehicleById(req, res);
});

// LIST WITH PAGINATION, FILTER, SORT
VehiclesRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.listVehicles(req, res);
});

// GET VEHICLES BY USER
VehiclesRouter.get('/user/:userId', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.getVehiclesByUser(req, res);
});

// TOP POLLUTERS
VehiclesRouter.get('/analytics/top-polluters', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.getTopPolluters(req, res);
});

// COUNT TOTAL
VehiclesRouter.get('/analytics/count', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.countVehicles(req, res);
});

// COUNT BY STATUS
VehiclesRouter.get('/analytics/count/:status', (req: AuthenticatedRequest, res: Response) => {
  VehicleController.countVehiclesByStatus(req, res);
});

export default VehiclesRouter;