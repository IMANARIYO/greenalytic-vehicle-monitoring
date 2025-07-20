import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import Response from '../utils/response.js';
import GpsDataService from '../services/GpsDataService.js';
import { CreateGpsDataDTO, UpdateGpsDataDTO, GpsDataQueryDTO } from '../types/dtos/GpsDataDto.js';

class GpsDataController {
  createGpsData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateGpsDataDTO = {
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      speed: parseFloat(req.body.speed),
      accuracy: req.body.accuracy ? parseFloat(req.body.accuracy) : undefined,
      vehicleId: parseInt(req.body.vehicleId),
      plateNumber: req.body.plateNumber,
      trackingDeviceId: req.body.trackingDeviceId ? parseInt(req.body.trackingDeviceId) : undefined,
      trackingStatus: req.body.trackingStatus !== undefined ? Boolean(req.body.trackingStatus) : undefined,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await GpsDataService.createGpsData(dto);
    return Response.created(res, result, 'GPS data created successfully');
  });

  getAllGpsData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleStatus: req.query.vehicleStatus as string,
      speedLevel: req.query.speedLevel as string,
      minSpeed: req.query.minSpeed ? parseFloat(req.query.minSpeed as string) : undefined,
      maxSpeed: req.query.maxSpeed ? parseFloat(req.query.maxSpeed as string) : undefined
    };

    const result = await GpsDataService.getAllGpsData(query);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await GpsDataService.getGpsDataById(id);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataByVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleId
    };

    const result = await GpsDataService.getGpsDataByVehicle(query);
    return Response.success(res, result, 'Vehicle GPS data retrieved successfully');
  });

  getGpsDataByVehicleInterval = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vehicleId,
      interval: req.query.interval as string,
      intervalValue: req.query.value as string
    };

    const result = await GpsDataService.getGpsDataByVehicleInterval(query);
    return Response.success(res, result, 'Vehicle GPS data retrieved successfully');
  });

  getGpsDataByPlateNumber = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const plateNumber = req.params.plateNumber;
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      plateNumber
    };

    const result = await GpsDataService.getGpsDataByPlateNumber(query);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataByLocationRadius = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      centerLatitude: parseFloat(req.query.centerLatitude as string),
      centerLongitude: parseFloat(req.query.centerLongitude as string),
      radiusKm: parseFloat(req.query.radiusKm as string),
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await GpsDataService.getGpsDataByLocationRadius(query);
    return Response.success(res, result, 'GPS data by location retrieved successfully');
  });

  getGpsDataBySpeedRange = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      minSpeed: parseFloat(req.query.minSpeed as string),
      maxSpeed: parseFloat(req.query.maxSpeed as string),
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await GpsDataService.getGpsDataBySpeedRange(query);
    return Response.success(res, result, 'GPS data by speed range retrieved successfully');
  });

  updateGpsData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateGpsDataDTO = {
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      speed: req.body.speed ? parseFloat(req.body.speed) : undefined,
      accuracy: req.body.accuracy ? parseFloat(req.body.accuracy) : undefined,
      plateNumber: req.body.plateNumber,
      trackingStatus: req.body.trackingStatus !== undefined ? Boolean(req.body.trackingStatus) : undefined,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await GpsDataService.updateGpsData(id, dto);
    return Response.success(res, result, 'GPS data updated successfully');
  });

  deleteGpsData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await GpsDataService.deleteGpsData(id);
    return Response.success(res, null, 'GPS data deleted successfully');
  });

  getGpsStatistics = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: GpsDataQueryDTO = {
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      interval: req.query.interval as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await GpsDataService.getGpsStatistics(query);
    return Response.success(res, result, 'GPS statistics retrieved successfully');
  });
}

export default new GpsDataController();