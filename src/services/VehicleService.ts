import { VehicleCreateRequest, VehicleUpdateRequest, VehicleFullDetails, VehicleListItemWithUser } from '../types/VehicleTypes';
import { VehicleStatus, EmissionStatus, UserStatus, UserRole } from '@prisma/client';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes';
import logger from '../utils/logger';
import VehicleRepository from '../repositories/VehicleRepository';
import { AppError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';
import UserRepository from '../repositories/UserRepository';

export class VehicleService {

  async assignVehicle(vehicleId: number, userId: number): Promise<void> {
    try {
      // Get vehicle and user - let repository handle database errors
      const vehicle = await VehicleRepository.getVehicleById(vehicleId);
      const user = await UserRepository.getUserById(userId);

      // Business logic validations - these are service-level concerns
      if (vehicle.deletedAt !== null) {
        throw new AppError('Vehicle is inactive', HttpStatusCode.BAD_REQUEST);
      }

      if (user && user.status !== UserStatus.ACTIVE) {
        throw new AppError('User is not active', HttpStatusCode.BAD_REQUEST);
      }

      // if (user.role !== UserRole.FLEET_MANAGER) {
      //   throw new AppError('User is not authorized to be assigned vehicles', HttpStatusCode.FORBIDDEN);
      // }

      if (vehicle.user && vehicle.user.id && vehicle.user.id !== userId) {
        throw new AppError('Vehicle is already assigned to another user', HttpStatusCode.CONFLICT);
      }

      if (vehicle.user && vehicle.user.id === userId) {
        throw new AppError('Vehicle is already assigned to this user', HttpStatusCode.BAD_REQUEST);
      }

      // Update assignment - let repository handle database errors
      await VehicleRepository.updateVehicle(vehicleId, { userId });

      logger.info(`Vehicle ${vehicleId} assigned to user ${userId}`);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::assignVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to assign vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::assignVehicle', appError);
      throw appError;
    }
  }

  async createVehicle(data: VehicleCreateRequest): Promise<VehicleFullDetails> {
    try {
      // Business logic validations could go here
      // For example: validate vehicle data, check duplicates, etc.

      const vehicle = await VehicleRepository.createVehicle(data);
      
      // Get full details for the created vehicle
      return await VehicleRepository.getVehicleById(vehicle.id);
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::createVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::createVehicle', appError);
      throw appError;
    }
  }

  async updateVehicle(id: number, data: VehicleUpdateRequest): Promise<VehicleFullDetails> {
    try {
      // Business logic validations could go here
      // For example: check if vehicle exists, validate update permissions, etc.

      const updatedVehicle = await VehicleRepository.updateVehicle(id, data);
      
      // Get full details for the updated vehicle
      return await VehicleRepository.getVehicleById(updatedVehicle.id);
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::updateVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::updateVehicle', appError);
      throw appError;
    }
  }

  async softDeleteVehicle(id: number): Promise<boolean> {
    try {
      // Business logic validations could go here
      // For example: check if vehicle can be deleted, has active assignments, etc.

      await VehicleRepository.softDeleteVehicle(id);
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::softDeleteVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to soft delete vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::softDeleteVehicle', appError);
      throw appError;
    }
  }

  async restoreVehicle(id: number): Promise<boolean> {
    try {
      // Business logic validations could go here
      // For example: check if vehicle can be restored, validate permissions, etc.

      await VehicleRepository.restoreVehicle(id);
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::restoreVehicle', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to restore vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::restoreVehicle', appError);
      throw appError;
    }
  }

  async deleteVehiclePermanently(id: number): Promise<boolean> {
    try {
      // Business logic validations could go here
      // For example: check if vehicle can be permanently deleted, admin permissions, etc.

      await VehicleRepository.deleteVehiclePermanently(id);
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::deleteVehiclePermanently', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to permanently delete vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::deleteVehiclePermanently', appError);
      throw appError;
    }
  }

  async getVehicleById(id: number): Promise<VehicleFullDetails> {
    try {
      // Business logic validations could go here
      // For example: check user permissions to view this vehicle, etc.

      return await VehicleRepository.getVehicleById(id);
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::getVehicleById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get vehicle by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::getVehicleById', appError);
      throw appError;
    }
  }

  async listVehicles(params: PaginationParams & {
    filters?: {
      status?: VehicleStatus;
      emissionStatus?: EmissionStatus;
      vehicleType?: string;
      userId?: number;
    };
  }): Promise<{ data: VehicleListItemWithUser[]; meta: PaginationMeta }> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortOrder
      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new AppError('Sort order must be either "asc" or "desc"', HttpStatusCode.BAD_REQUEST);
      }

      // Validate search term length if provided
      if (search && search.length < 2) {
        throw new AppError('Search term must be at least 2 characters long', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field (basic validation - you might want to extend this)
      const allowedSortFields = [
        'id', 'plateNumber', 'registrationNumber', 'chassisNumber',
        'vehicleType', 'vehicleModel', 'yearOfManufacture', 'usage',
        'fuelType', 'status', 'emissionStatus', 'createdAt', 'updatedAt', 'userId'
      ];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      return await VehicleRepository.listVehicles(params);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::listVehicles', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to list vehicles',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::listVehicles', appError);
      throw appError;
    }
  }

  async getVehiclesByUser(userId: number): Promise<VehicleListItemWithUser[]> {
    try {
      // Business logic validations could go here
      // For example: validate user exists, check permissions, etc.

      return await VehicleRepository.getVehiclesByUser(userId);
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::getVehiclesByUser', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get vehicles by user',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::getVehiclesByUser', appError);
      throw appError;
    }
  }

  async getTopPolluters(limit = 5): Promise<VehicleListItemWithUser[]> {
    try {
      // Business logic validations could go here
      // For example: validate limit parameter, check permissions, etc.

      if (limit < 1 || limit > 50) {
        throw new AppError('Limit must be between 1 and 50', HttpStatusCode.BAD_REQUEST);
      }

      return await VehicleRepository.getTopPolluters(limit);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::getTopPolluters', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get top polluters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::getTopPolluters', appError);
      throw appError;
    }
  }

  async countVehicles(): Promise<number> {
    try {
      // Business logic validations could go here
      // For example: check permissions, etc.

      return await VehicleRepository.countVehicles();
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::countVehicles', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count vehicles',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::countVehicles', appError);
      throw appError;
    }
  }

  async countVehiclesByStatus(status: VehicleStatus): Promise<number> {
    try {
      // Business logic validations could go here
      // For example: validate status enum, check permissions, etc.

      return await VehicleRepository.countVehiclesByStatus(status);
    } catch (error: any) {
      // If it's already an AppError (from repository), rethrow
      if (error instanceof AppError) {
        logger.error('VehicleService::countVehiclesByStatus', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count vehicles by status',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleService::countVehiclesByStatus', appError);
      throw appError;
    }
  }
}