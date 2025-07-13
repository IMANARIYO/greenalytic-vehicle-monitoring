import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import { catchAsync } from '../middlewares/errorHandler';
import Response from '../utils/response';
import OBDDataService from '../services/OBDDataService';
import { CreateOBDDataDTO, UpdateOBDDataDTO, OBDDataQueryDTO } from '../types/dtos/OBDDataDto';

class OBDDataController {
  createOBDData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateOBDDataDTO = {
      rpm: req.body.rpm ? parseInt(req.body.rpm) : undefined,
      throttlePosition: parseFloat(req.body.throttlePosition),
      engineTemperature: req.body.engineTemperature ? parseFloat(req.body.engineTemperature) : undefined,
      engineStatus: req.body.engineStatus,
      faultCodes: req.body.faultCodes || [],
      vehicleId: parseInt(req.body.vehicleId),
      plateNumber: req.body.plateNumber,
      trackingDeviceId: parseInt(req.body.trackingDeviceId),
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await OBDDataService.createOBDData(dto);
    return Response.created(res, result, 'OBD data created successfully');
  });

  getAllOBDData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: OBDDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleStatus: req.query.vehicleStatus as string,
      engineStatus: req.query.engineStatus as string,
      hasFaultCodes: req.query.hasFaultCodes ? req.query.hasFaultCodes === 'true' : undefined,
      minRPM: req.query.minRPM ? parseInt(req.query.minRPM as string) : undefined,
      maxRPM: req.query.maxRPM ? parseInt(req.query.maxRPM as string) : undefined,
      minEngineTemp: req.query.minEngineTemp ? parseFloat(req.query.minEngineTemp as string) : undefined,
      maxEngineTemp: req.query.maxEngineTemp ? parseFloat(req.query.maxEngineTemp as string) : undefined,
      minThrottlePosition: req.query.minThrottlePosition ? parseFloat(req.query.minThrottlePosition as string) : undefined,
      maxThrottlePosition: req.query.maxThrottlePosition ? parseFloat(req.query.maxThrottlePosition as string) : undefined
    };

    const result = await OBDDataService.getAllOBDData(query);
    return Response.success(res, result, 'OBD data retrieved successfully');
  });

  getOBDDataById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await OBDDataService.getOBDDataById(id);
    return Response.success(res, result, 'OBD data retrieved successfully');
  });

  getOBDDataByVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleId
    };

    const result = await OBDDataService.getOBDDataByVehicle(query);
    return Response.success(res, result, 'Vehicle OBD data retrieved successfully');
  });

  getOBDDataByVehicleInterval = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vehicleId,
      interval: req.query.interval as string,
      intervalValue: req.query.value as string
    };

    const result = await OBDDataService.getOBDDataByVehicleInterval(query);
    return Response.success(res, result, 'Vehicle OBD data retrieved successfully');
  });

  getOBDDataByPlateNumber = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const plateNumber = req.params.plateNumber;
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      plateNumber
    };

    const result = await OBDDataService.getOBDDataByPlateNumber(query);
    return Response.success(res, result, 'OBD data retrieved successfully');
  });

  updateOBDData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateOBDDataDTO = {
      rpm: req.body.rpm ? parseInt(req.body.rpm) : undefined,
      throttlePosition: req.body.throttlePosition ? parseFloat(req.body.throttlePosition) : undefined,
      engineTemperature: req.body.engineTemperature ? parseFloat(req.body.engineTemperature) : undefined,
      engineStatus: req.body.engineStatus,
      faultCodes: req.body.faultCodes,
      plateNumber: req.body.plateNumber,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await OBDDataService.updateOBDData(id, dto);
    return Response.success(res, result, 'OBD data updated successfully');
  });

  deleteOBDData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await OBDDataService.deleteOBDData(id);
    return Response.success(res, null, 'OBD data deleted successfully');
  });

  getOBDStatistics = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: OBDDataQueryDTO = {
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      interval: req.query.interval as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      engineStatus: req.query.engineStatus as string
    };

    const result = await OBDDataService.getOBDStatistics(query);
    return Response.success(res, result, 'OBD statistics retrieved successfully');
  });
}

export default new OBDDataController();