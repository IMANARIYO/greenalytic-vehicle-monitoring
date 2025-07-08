import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import { catchAsync } from '../middlewares/errorHandler';
import Response from '../utils/response';
import GpsDataService from '../services/GpsDataService';
import { CreateGpsDataDTO, UpdateGpsDataDTO, GpsDataQueryDTO } from '../types/dtos/GpsDataDto';

class GpsDataController {
  private gpsDataService: GpsDataService;

  constructor() {
    this.gpsDataService = new GpsDataService();
  }

  createGpsData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateGpsDataDTO = {
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      speed: parseFloat(req.body.speed),
      accuracy: req.body.accuracy ? parseFloat(req.body.accuracy) : undefined,
      vehicleId: parseInt(req.body.vehicleId),
      plateNumber: req.body.plateNumber,
      trackingDeviceId: req.body.trackingDeviceId ? parseInt(req.body.trackingDeviceId) : undefined,
      trackingStatus: req.body.trackingStatus,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await this.gpsDataService.createGpsData(dto);
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

    const result = await this.gpsDataService.getAllGpsData(query);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await this.gpsDataService.getGpsDataById(id);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataByVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleId
    };

    const result = await this.gpsDataService.getGpsDataByVehicle(query);
    return Response.success(res, result, 'Vehicle GPS data retrieved successfully');
  });

  getGpsDataByVehicleInterval = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vehicleId,
      interval: req.query.interval as string,
      intervalValue: req.query.value as string
    };

    const result = await this.gpsDataService.getGpsDataByVehicleInterval(query);
    return Response.success(res, result, 'Vehicle GPS data retrieved successfully');
  });

  getGpsDataByPlateNumber = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const plateNumber = req.params.plateNumber;
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      plateNumber
    };

    const result = await this.gpsDataService.getGpsDataByPlateNumber(query);
    return Response.success(res, result, 'GPS data retrieved successfully');
  });

  getGpsDataByLocationRadius = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      centerLatitude: req.query.centerLatitude ? parseFloat(req.query.centerLatitude as string) : undefined,
      centerLongitude: req.query.centerLongitude ? parseFloat(req.query.centerLongitude as string) : undefined,
      radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await this.gpsDataService.getGpsDataByLocationRadius(query);
    return Response.success(res, result, 'GPS data by location retrieved successfully');
  });

  getGpsDataBySpeedRange = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: GpsDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      minSpeed: req.query.minSpeed ? parseFloat(req.query.minSpeed as string) : undefined,
      maxSpeed: req.query.maxSpeed ? parseFloat(req.query.maxSpeed as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await this.gpsDataService.getGpsDataBySpeedRange(query);
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
      trackingStatus: req.body.trackingStatus,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
      deletedAt: req.body.deletedAt ? new Date(req.body.deletedAt) : undefined
    };

    const result = await this.gpsDataService.updateGpsData(id, dto);
    return Response.success(res, result, 'GPS data updated successfully');
  });

  deleteGpsData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await this.gpsDataService.deleteGpsData(id);
    return Response.success(res, null, 'GPS data deleted successfully');
  });

  getGpsStatistics = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: GpsDataQueryDTO = {
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      interval: req.query.interval as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await this.gpsDataService.getGpsStatistics(query);
    return Response.success(res, result, 'GPS statistics retrieved successfully');
  });
}

export default GpsDataController;