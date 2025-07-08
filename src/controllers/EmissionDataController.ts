import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import { catchAsync } from '../middlewares/errorHandler';
import Response from '../utils/response';
import {EmissionDataService} from '../services/EmissionDataService';
import { CreateEmissionDataDTO, UpdateEmissionDataDTO, EmissionDataQueryDTO } from '../types/dtos/EmissionDataDto';

class EmissionDataController {
  private emissionDataService: EmissionDataService;

  constructor() {
    this.emissionDataService = new EmissionDataService();
  }

  createEmissionData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateEmissionDataDTO = {
      co2Percentage: parseFloat(req.body.co2Percentage),
      coPercentage: parseFloat(req.body.coPercentage),
      o2Percentage: parseFloat(req.body.o2Percentage),
      hcPPM: parseInt(req.body.hcPPM),
      noxPPM: req.body.noxPPM ? parseFloat(req.body.noxPPM) : undefined,
      pm25Level: req.body.pm25Level ? parseFloat(req.body.pm25Level) : undefined,
      vehicleId: parseInt(req.body.vehicleId),
      plateNumber: req.body.plateNumber,
      trackingDeviceId: parseInt(req.body.trackingDeviceId),
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    const result = await this.emissionDataService.createEmissionData(dto);
    return Response.created(res, result, 'Emission data created successfully');
  });

  getAllEmissionData = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: EmissionDataQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleStatus: req.query.vehicleStatus as string,
      emissionLevel: req.query.emissionLevel as string,
      deviceCategory: req.query.deviceCategory as string
    };

    const result = await this.emissionDataService.getAllEmissionData(query);
    return Response.success(res, result, 'Emission data retrieved successfully');
  });

  getEmissionDataById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await this.emissionDataService.getEmissionDataById(id);
    return Response.success(res, result, 'Emission data retrieved successfully');
  });

  getEmissionDataByVehicle = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      vehicleId
    };

    const result = await this.emissionDataService.getEmissionDataByVehicle(query);
    return Response.success(res, result, 'Vehicle emission data retrieved successfully');
  });

  getEmissionDataByVehicleInterval = catchAsync(async (req: Request, res: ExpressResponse) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vehicleId,
      interval: req.query.interval as string,
      intervalValue: req.query.value as string
    };

    const result = await this.emissionDataService.getEmissionDataByVehicleInterval(query);
    return Response.success(res, result, 'Vehicle emission data retrieved successfully');
  });

  getEmissionDataByPlateNumber = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const plateNumber = req.params.plateNumber;
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      plateNumber
    };

    const result = await this.emissionDataService.getEmissionDataByPlateNumber(query);
    return Response.success(res, result, 'Emission data retrieved successfully');
  });

  updateEmissionData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateEmissionDataDTO = {
      co2Percentage: req.body.co2Percentage ? parseFloat(req.body.co2Percentage) : undefined,
      coPercentage: req.body.coPercentage ? parseFloat(req.body.coPercentage) : undefined,
      o2Percentage: req.body.o2Percentage ? parseFloat(req.body.o2Percentage) : undefined,
      hcPPM: req.body.hcPPM ? parseInt(req.body.hcPPM) : undefined,
      noxPPM: req.body.noxPPM ? parseFloat(req.body.noxPPM) : undefined,
      pm25Level: req.body.pm25Level ? parseFloat(req.body.pm25Level) : undefined,
      plateNumber: req.body.plateNumber,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
      deletedAt: req.body.deletedAt ? new Date(req.body.deletedAt) : undefined
    };

    const result = await this.emissionDataService.updateEmissionData(id, dto);
    return Response.success(res, result, 'Emission data updated successfully');
  });

  deleteEmissionData = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await this.emissionDataService.deleteEmissionData(id);
    return Response.success(res, null, 'Emission data deleted successfully');
  });

  getEmissionStatistics = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: EmissionDataQueryDTO = {
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
      interval: req.query.interval as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
    };

    const result = await this.emissionDataService.getEmissionStatistics(query);
    return Response.success(res, result, 'Emission statistics retrieved successfully');
  });
}

export default new EmissionDataController();