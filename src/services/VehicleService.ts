
import { VehicleCreateRequest, VehicleUpdateRequest, VehicleFullDetails, VehicleListItemWithUser } from '../types/VehicleTypes';
import { VehicleStatus, EmissionStatus } from '@prisma/client';
import logger from '../utils/logger';
import VehicleRepository from '../repositories/VehicleRepository';

export class VehicleService {


  async createVehicle(data: VehicleCreateRequest): Promise<VehicleFullDetails> {
    try {


      const vehicle = await VehicleRepository.createVehicle(data);
      return vehicle as unknown as VehicleFullDetails;
    } catch (error) {
      logger.error('VehicleService::createVehicle', error);
      throw error;
    }
  }

  async updateVehicle(id: number, data: VehicleUpdateRequest): Promise<VehicleFullDetails> {
    try {
      const updatedVehicle = await VehicleRepository.updateVehicle(id, data);
      return updatedVehicle as unknown as VehicleFullDetails;
    } catch (error) {
      logger.error('VehicleService::updateVehicle', error);
      throw error;
    }
  }

  async softDeleteVehicle(id: number): Promise<boolean> {
    try {
      await VehicleRepository.softDeleteVehicle(id);
      return true;
    } catch (error) {
      logger.error('VehicleService::softDeleteVehicle', error);
      throw error;
    }
  }

  async restoreVehicle(id: number): Promise<boolean> {
    try {
      await VehicleRepository.restoreVehicle(id);
      return true;
    } catch (error) {
      logger.error('VehicleService::restoreVehicle', error);
      throw error;
    }
  }

  async deleteVehiclePermanently(id: number): Promise<boolean> {
    try {
      await VehicleRepository.deleteVehiclePermanently(id);
      return true;
    } catch (error) {
      logger.error('VehicleService::deleteVehiclePermanently', error);
      throw error;
    }
  }

  async getVehicleById(id: number): Promise<VehicleFullDetails> {
    try {
      const vehicle = await VehicleRepository.getVehicleById(id);
      if (!vehicle) throw new Error('Vehicle not found');
      return vehicle;
    } catch (error) {
      logger.error('VehicleService::getVehicleById', error);
      throw error;
    }
  }

  async listVehicles(params: {
    page?: number;
    limit?: number;
    filter?: {
      status?: VehicleStatus;
      emissionStatus?: EmissionStatus;
      vehicleType?: string;
      userId?: number;
    };
    sortBy?: 
      | "id"
      | "plateNumber"
      | "registrationNumber"
      | "chassisNumber"
      | "vehicleType"
      | "vehicleModel"
      | "yearOfManufacture"
      | "usage"
      | "fuelType"
      | "status"
      | "emissionStatus"
      | "createdAt"
      | "updatedAt"
      | "userId"
      | undefined;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: VehicleListItemWithUser[]; meta: any }> {
    try {
      return await VehicleRepository.listVehicles(params);
    } catch (error) {
      logger.error('VehicleService::listVehicles', error);
      throw error;
    }
  }

  async getVehiclesByUser(userId: number): Promise<VehicleListItemWithUser[]> {
    try {
      return await VehicleRepository.getVehiclesByUser(userId);
    } catch (error) {
      logger.error('VehicleService::getVehiclesByUser', error);
      throw error;
    }
  }

  async getTopPolluters(limit = 5): Promise<VehicleListItemWithUser[]> {
    try {
      return await VehicleRepository.getTopPolluters(limit);
    } catch (error) {
      logger.error('VehicleService::getTopPolluters', error);
      throw error;
    }
  }

  async countVehicles(): Promise<number> {
    try {
      return await VehicleRepository.countVehicles();
    } catch (error) {
      logger.error('VehicleService::countVehicles', error);
      throw error;
    }
  }

  async countVehiclesByStatus(status: VehicleStatus): Promise<number> {
    try {
      return await VehicleRepository.countVehiclesByStatus(status);
    } catch (error) {
      logger.error('VehicleService::countVehiclesByStatus', error);
      throw error;
    }
  }
}
