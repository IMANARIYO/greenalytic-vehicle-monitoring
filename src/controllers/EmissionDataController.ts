import { Request, Response as ExpressResponse } from 'express';
import EmissionDataService from '../services/EmissionDataService';
import Response from '../utils/response';
import { CreateEmissionDataDTO, UpdateEmissionDataDTO, EmissionDataQueryDTO } from '../types/dtos/EmissionDataDto';

class EmissionDataController {
  
  constructor() {
    this.createEmissionData = this.createEmissionData.bind(this);
    this.getAllEmissionData = this.getAllEmissionData.bind(this);
    this.getEmissionDataById = this.getEmissionDataById.bind(this);
    this.getEmissionDataByVehicle = this.getEmissionDataByVehicle.bind(this);
    this.getEmissionDataByVehicleInterval = this.getEmissionDataByVehicleInterval.bind(this);
    this.getEmissionDataByPlateNumber = this.getEmissionDataByPlateNumber.bind(this);
    this.updateEmissionData = this.updateEmissionData.bind(this);
    this.deleteEmissionData = this.deleteEmissionData.bind(this);
    this.getEmissionStatistics = this.getEmissionStatistics.bind(this);
  }

  async createEmissionData(req: Request, res: ExpressResponse) {
    try {
      // Validate required fields
      const requiredFields = ['vehicleId', 'co2Percentage', 'coPercentage', 'o2Percentage', 'hcPPM'];
      const missingFields = requiredFields.filter(field => 
        req.body[field] === undefined || req.body[field] === null
      );
      
      if (missingFields.length > 0) {
        return Response.badRequest(res, `Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate vehicleId
      if (isNaN(parseInt(req.body.vehicleId)) || parseInt(req.body.vehicleId) <= 0) {
        return Response.badRequest(res, 'Invalid vehicle ID. Must be a positive integer.');
      }

      // Validate emission values ranges
      const validations = [
        { field: 'co2Percentage', value: req.body.co2Percentage, min: 0, max: 20 },
        { field: 'coPercentage', value: req.body.coPercentage, min: 0, max: 10 },
        { field: 'o2Percentage', value: req.body.o2Percentage, min: 0, max: 25 },
        { field: 'hcPPM', value: req.body.hcPPM, min: 0, max: 10000 },
        { field: 'noxPPM', value: req.body.noxPPM, min: 0, max: 5000 },
        { field: 'pm25Level', value: req.body.pm25Level, min: 0, max: 500 }
      ];

      for (const validation of validations) {
        if (validation.value !== undefined && validation.value !== null) {
          if (isNaN(validation.value) || validation.value < validation.min || validation.value > validation.max) {
            return Response.badRequest(res, 
              `${validation.field} must be a number between ${validation.min} and ${validation.max}`
            );
          }
        }
      }

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

      const result = await EmissionDataService.createEmissionData(dto);
      return Response.created(res, result, 'Emission data created successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to create emission data');
    }
  }

  async getAllEmissionData(req: Request, res: ExpressResponse) {
    try {
      const query: EmissionDataQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        vehicleStatus: req.query.vehicleStatus as string,
        emissionLevel: req.query.emissionLevel as string,
        deviceCategory: req.query.deviceCategory as string
      };

      const result = await EmissionDataService.getAllEmissionData(query);
      return Response.success(res, result, 'Emission data retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to fetch emission data');
    }
  }

  async getEmissionDataById(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return Response.badRequest(res, 'Invalid emission data ID');
      }

      const result = await EmissionDataService.getEmissionDataById(id);
      if (!result) {
        return Response.notFound(res, 'Emission data not found');
      }

      return Response.success(res, result, 'Emission data retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to fetch emission data');
    }
  }

  async getEmissionDataByVehicle(req: Request, res: ExpressResponse) {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return Response.badRequest(res, 'Invalid vehicle ID');
      }

      const query: EmissionDataQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        vehicleId
      };

      const result = await EmissionDataService.getEmissionDataByVehicle(query);
      return Response.success(res, result, 'Vehicle emission data retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to fetch emission data');
    }
  }

  async getEmissionDataByVehicleInterval(req: Request, res: ExpressResponse) {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return Response.badRequest(res, 'Invalid vehicle ID');
      }

      const interval = req.query.interval as string;
      const value = req.query.value as string;

      if (!interval || !value) {
        return Response.badRequest(res, 'Interval and value are required parameters');
      }

      const query: EmissionDataQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        vehicleId,
        interval,
        intervalValue: value
      };

      const result = await EmissionDataService.getEmissionDataByVehicleInterval(query);
      return Response.success(res, result, 'Vehicle emission data retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to fetch emission data by interval');
    }
  }

  async getEmissionDataByPlateNumber(req: Request, res: ExpressResponse) {
    try {
      const plateNumber = req.params.plateNumber;
      if (!plateNumber) {
        return Response.badRequest(res, 'Plate number is required');
      }

      const query: EmissionDataQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        plateNumber
      };

      const result = await EmissionDataService.getEmissionDataByPlateNumber(query);
      return Response.success(res, result, 'Emission data retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to fetch emission data');
    }
  }

  async updateEmissionData(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return Response.badRequest(res, 'Invalid emission data ID');
      }

      // Validate emission values if they are being updated
      if (req.body.co2Percentage !== undefined) {
        const co2 = parseFloat(req.body.co2Percentage);
        if (isNaN(co2) || co2 < 0 || co2 > 100) {
          return Response.badRequest(res, 'CO2 percentage must be between 0 and 100');
        }
      }

      if (req.body.coPercentage !== undefined) {
        const co = parseFloat(req.body.coPercentage);
        if (isNaN(co) || co < 0 || co > 100) {
          return Response.badRequest(res, 'CO percentage must be between 0 and 100');
        }
      }

      if (req.body.o2Percentage !== undefined) {
        const o2 = parseFloat(req.body.o2Percentage);
        if (isNaN(o2) || o2 < 0 || o2 > 100) {
          return Response.badRequest(res, 'O2 percentage must be between 0 and 100');
        }
      }

      if (req.body.hcPPM !== undefined) {
        const hc = parseInt(req.body.hcPPM);
        if (isNaN(hc) || hc < 0) {
          return Response.badRequest(res, 'HC PPM must be non-negative');
        }
      }

      const dto: UpdateEmissionDataDTO = {
        co2Percentage: req.body.co2Percentage ? parseFloat(req.body.co2Percentage) : undefined,
        coPercentage: req.body.coPercentage ? parseFloat(req.body.coPercentage) : undefined,
        o2Percentage: req.body.o2Percentage ? parseFloat(req.body.o2Percentage) : undefined,
        hcPPM: req.body.hcPPM ? parseInt(req.body.hcPPM) : undefined,
        noxPPM: req.body.noxPPM ? parseFloat(req.body.noxPPM) : undefined,
        pm25Level: req.body.pm25Level ? parseFloat(req.body.pm25Level) : undefined,
        vehicleId: req.body.vehicleId ? parseInt(req.body.vehicleId) : undefined,
        plateNumber: req.body.plateNumber,
        trackingDeviceId: req.body.trackingDeviceId ? parseInt(req.body.trackingDeviceId) : undefined,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
        deletedAt: req.body.deletedAt ? new Date(req.body.deletedAt) : undefined
      };

      const result = await EmissionDataService.updateEmissionData(id, dto);
      if (!result) {
        return Response.notFound(res, 'Emission data not found');
      }

      return Response.success(res, result, 'Emission data updated successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to update emission data');
    }
  }

  async deleteEmissionData(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return Response.badRequest(res, 'Invalid emission data ID');
      }

      const result = await EmissionDataService.deleteEmissionData(id);
      if (!result) {
        return Response.notFound(res, 'Emission data not found');
      }

      return Response.success(res, null, 'Emission data deleted successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to delete emission data');
    }
  }

  async getEmissionStatistics(req: Request, res: ExpressResponse) {
    try {
      const query: EmissionDataQueryDTO = {
        vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
        interval: req.query.interval as string,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined
      };

      // Validate interval if provided
      if (query.interval && !['day', 'week', 'month'].includes(query.interval)) {
        return Response.badRequest(res, 'Invalid interval. Use day, week, or month');
      }

      const result = await EmissionDataService.getEmissionStatistics(query);
      return Response.success(res, result, 'Emission statistics retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Failed to calculate emission statistics');
    }
  }
}

export default EmissionDataController;