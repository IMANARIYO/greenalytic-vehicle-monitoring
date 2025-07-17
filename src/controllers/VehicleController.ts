import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import { catchAsync } from '../middlewares/errorHandler';
import Response from '../utils/response';
import { VehicleService } from '../services/VehicleService';
import logger from '../utils/logger';

class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  createVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicle = await this.vehicleService.createVehicle(req.body);
    return Response.created(res, vehicle, 'Vehicle created successfully');
  });

  updateVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const updated = await this.vehicleService.updateVehicle(id, req.body);
    return Response.success(res, updated, 'Vehicle updated successfully');
  });

  softDeleteVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await this.vehicleService.softDeleteVehicle(id);
    return Response.success(res, null, 'Vehicle soft deleted');
  });

  restoreVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await this.vehicleService.restoreVehicle(id);
    return Response.success(res, null, 'Vehicle restored');
  });

  deleteVehiclePermanently = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await this.vehicleService.deleteVehiclePermanently(id);
    return Response.success(res, null, 'Vehicle permanently deleted');
  });

  getVehicleById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const vehicle = await this.vehicleService.getVehicleById(id);
    
    const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'FLEET_MANAGER';
    if (!isAdmin && vehicle.user.id !== req.userId) {
      return Response.unauthorized(res, 'You are not allowed to view this vehicle');
    }

    return Response.success(res, vehicle, 'Vehicle details fetched');
  });

  listVehicles = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'FLEET_MANAGER';
const params=req.query
console.log("the  query was *****************************",params)
    const result = await this.vehicleService.listVehicles(params);
    return Response.success(res, result, 'Vehicles listed successfully');
  });

  getVehiclesByUser = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const requestedUserId = parseInt(req.params.userId);
    const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'FLEET_MANAGER';

    if (!isAdmin && requestedUserId !== req.userId) {
      return Response.unauthorized(res, 'You are not allowed to access other users\' vehicles');
    }

    const vehicles = await this.vehicleService.getVehiclesByUser(requestedUserId);
    return Response.success(res, vehicles, 'User vehicles fetched');
  });

  getTopPolluters = catchAsync(async (req: Request, res: ExpressResponse) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const topVehicles = await this.vehicleService.getTopPolluters(limit);
    return Response.success(res, topVehicles, 'Top polluting vehicles fetched');
  });

  countVehicles = catchAsync(async (req: Request, res: ExpressResponse) => {
    const count = await this.vehicleService.countVehicles();
    return Response.success(res, { count }, 'Total vehicles counted');
  });

  countVehiclesByStatus = catchAsync(async (req: Request, res: ExpressResponse) => {
    const status = req.params.status as any;
    const count = await this.vehicleService.countVehiclesByStatus(status);
    return Response.success(res, { count }, 'Vehicle count by status');
  });

  assignVehicle = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const userId = parseInt(req.params.userId);
    
    await this.vehicleService.assignVehicle(vehicleId, userId);
    return Response.success(res, null, 'Vehicle assigned successfully');
  });
}

export default new VehicleController();