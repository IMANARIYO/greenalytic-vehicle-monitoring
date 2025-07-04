import { Request, Response as ExpressResponse } from 'express';

import logger from '../utils/logger';
import { VehicleService } from '../services/VehicleService';
import Response from '../utils/response';

 class VehicleController {
  static async createVehicle(req: Request, res: ExpressResponse) {
    try {
      const vehicle = await new VehicleService().createVehicle(req.body);
      return Response.created(res, vehicle, 'Vehicle created successfully');
    } catch (error) {
      logger.error('VehicleController::createVehicle', error);
      return Response.error(res, error, 'Failed to create vehicle');
    }
  }

  static async updateVehicle(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const updated = await new VehicleService().updateVehicle(id, req.body);
      return Response.success(res, updated, 'Vehicle updated successfully');
    } catch (error) {
      logger.error('VehicleController::updateVehicle', error);
      return Response.error(res, error, 'Failed to update vehicle');
    }
  }

  static async softDeleteVehicle(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await new VehicleService().softDeleteVehicle(id);
      return Response.success(res, null, 'Vehicle soft deleted');
    } catch (error) {
      logger.error('VehicleController::softDeleteVehicle', error);
      return Response.error(res, error, 'Failed to delete vehicle');
    }
  }

  static async restoreVehicle(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await new VehicleService().restoreVehicle(id);
      return Response.success(res, null, 'Vehicle restored');
    } catch (error) {
      logger.error('VehicleController::restoreVehicle', error);
      return Response.error(res, error, 'Failed to restore vehicle');
    }
  }

  static async deleteVehiclePermanently(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await new VehicleService().deleteVehiclePermanently(id);
      return Response.success(res, null, 'Vehicle permanently deleted');
    } catch (error) {
      logger.error('VehicleController::deleteVehiclePermanently', error);
      return Response.error(res, error, 'Failed to permanently delete vehicle');
    }
  }

  static async getVehicleById(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await new VehicleService().getVehicleById(id);
      return Response.success(res, vehicle, 'Vehicle details fetched');
    } catch (error) {
      logger.error('VehicleController::getVehicleById', error);
      return Response.error(res, error, 'Failed to fetch vehicle details');
    }
  }

  static async listVehicles(req: Request, res: ExpressResponse) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        filter: {
          status: req.query.status as any,
          emissionStatus: req.query.emissionStatus as any,
          vehicleType: req.query.vehicleType as string,
          userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        },
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
      };

      const result = await new VehicleService().listVehicles(params);
      return Response.success(res, result, 'Vehicles listed successfully');
    } catch (error) {
      logger.error('VehicleController::listVehicles', error);
      return Response.error(res, error, 'Failed to list vehicles');
    }
  }

  static async getVehiclesByUser(req: Request, res: ExpressResponse) {
    try {
      const userId = parseInt(req.params.userId);
      const vehicles = await new VehicleService().getVehiclesByUser(userId);
      return Response.success(res, vehicles, 'User vehicles fetched');
    } catch (error) {
      logger.error('VehicleController::getVehiclesByUser', error);
      return Response.error(res, error, 'Failed to fetch user vehicles');
    }
  }

  static async getTopPolluters(req: Request, res: ExpressResponse) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topVehicles = await new VehicleService().getTopPolluters(limit);
      return Response.success(res, topVehicles, 'Top polluting vehicles fetched');
    } catch (error) {
      logger.error('VehicleController::getTopPolluters', error);
      return Response.error(res, error, 'Failed to fetch top polluters');
    }
  }

  static async countVehicles(req: Request, res: ExpressResponse) {
    try {
      const count = await new VehicleService().countVehicles();
      return Response.success(res, { count }, 'Total vehicles counted');
    } catch (error) {
      logger.error('VehicleController::countVehicles', error);
      return Response.error(res, error, 'Failed to count vehicles');
    }
  }

  static async countVehiclesByStatus(req: Request, res: ExpressResponse) {
    try {
      const status = req.params.status as any;
      const count = await new VehicleService().countVehiclesByStatus(status);
      return Response.success(res, { count }, 'Vehicle count by status');
    } catch (error) {
      logger.error('VehicleController::countVehiclesByStatus', error);
      return Response.error(res, error, 'Failed to count vehicles by status');
    }
  }
}
export default  VehicleController;