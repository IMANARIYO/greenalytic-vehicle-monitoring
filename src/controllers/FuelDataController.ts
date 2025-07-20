import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import Response from '../utils/response.js';
import FuelDataService from '../services/FuelDataService.js';
import { CreateFuelDataDTO, UpdateFuelDataDTO, FuelDataQueryDTO } from '../types/dtos/FuelDataDto.js';

class FuelDataController {
  createFuelData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateFuelDataDTO = {
      fuelLevel: parseFloat(req.body.fuelLevel),
      fuelConsumption: parseFloat(req.body.fuelConsumption),
      vehicleId: parseInt(req.body.vehicleId),
      plateNumber: req.body.plateNumber,
      trackingDeviceId: parseInt(req.body.trackingDeviceId),
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await FuelDataService.createFuelData(dto);
    return Response.created(res, result, 'Fuel data created successfully');
  });

  getAllFuelData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: FuelDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleStatus: req.query.vehicleStatus as string,
      fuelLevel: req.query.fuelLevel as string,
      consumptionLevel: req.query.consumptionLevel as string,
      minConsumption: req.query.minConsumption ? parseFloat(req.query.minConsumption as string) : undefined,
      maxConsumption: req.query.maxConsumption ? parseFloat(req.query.maxConsumption as string) : undefined,
      minFuelLevel: req.query.minFuelLevel ? parseFloat(req.query.minFuelLevel as string) : undefined,
      maxFuelLevel: req.query.maxFuelLevel ? parseFloat(req.query.maxFuelLevel as string) : undefined
    };

    const result = await FuelDataService.getAllFuelData(query);
    return Response.success(res, result, 'Fuel data retrieved successfully');
  });

  getFuelDataById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await FuelDataService.getFuelDataById(id);
    return Response.success(res, result, 'Fuel data retrieved successfully');
  });

  getFuelDataByVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleId
    };

    const result = await FuelDataService.getFuelDataByVehicle(query);
    return Response.success(res, result, 'Vehicle fuel data retrieved successfully');
  });

  getFuelDataByVehicleInterval = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vehicleId,
      interval: req.query.interval as string,
      intervalValue: req.query.value as string
    };

    const result = await FuelDataService.getFuelDataByVehicleInterval(query);
    return Response.success(res, result, 'Vehicle fuel data retrieved successfully');
  });

  getFuelDataByPlateNumber = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const plateNumber = req.params.plateNumber;
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      plateNumber
    };

    const result = await FuelDataService.getFuelDataByPlateNumber(query);
    return Response.success(res, result, 'Fuel data retrieved successfully');
  });

  getFuelDataByConsumptionRange = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      minConsumption: parseFloat(req.query.minConsumption as string),
      maxConsumption: parseFloat(req.query.maxConsumption as string),
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await FuelDataService.getFuelDataByConsumptionRange(query);
    return Response.success(res, result, 'Fuel data by consumption range retrieved successfully');
  });

  updateFuelData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateFuelDataDTO = {
      fuelLevel: req.body.fuelLevel ? parseFloat(req.body.fuelLevel) : undefined,
      fuelConsumption: req.body.fuelConsumption ? parseFloat(req.body.fuelConsumption) : undefined,
      plateNumber: req.body.plateNumber,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await FuelDataService.updateFuelData(id, dto);
    return Response.success(res, result, 'Fuel data updated successfully');
  });

  deleteFuelData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await FuelDataService.deleteFuelData(id);
    return Response.success(res, null, 'Fuel data deleted successfully');
  });

  getFuelStatistics = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: FuelDataQueryDTO = {
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      interval: req.query.interval as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      fuelType: req.query.fuelType as string
    };

    const result = await FuelDataService.getFuelStatistics(query);
    return Response.success(res, result, 'Fuel statistics retrieved successfully');
  });
}

export default new FuelDataController();