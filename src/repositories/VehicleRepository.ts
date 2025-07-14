import { VehicleStatus, EmissionStatus, Vehicle, Prisma } from '@prisma/client';
import {
  VehicleCreateRequest,
  VehicleUpdateRequest,
  VehicleFullDetails,
  VehicleListItemWithUser,
} from '../types/VehicleTypes';
import logger from '../utils/logger';
import { PaginationMeta, PaginationParams } from '../types/GlobalTypes';
import prisma from '../config/db';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';

class VehicleRepository {
  async createVehicle(data: VehicleCreateRequest): Promise<Vehicle> {
    try {
      return await prisma.vehicle.create({ data });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::createVehicle', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::createVehicle', appError);
      throw appError;
    }
  }

  async updateVehicle(id: number, data: VehicleUpdateRequest): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::updateVehicle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::updateVehicle', appError);
      throw appError;
    }
  }

  async softDeleteVehicle(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::softDeleteVehicle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to soft delete vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::softDeleteVehicle', appError);
      throw appError;
    }
  }

  async restoreVehicle(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::restoreVehicle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to restore vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::restoreVehicle', appError);
      throw appError;
    }
  }

  async deleteVehiclePermanently(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.delete({ where: { id } });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::deleteVehiclePermanently', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to permanently delete vehicle',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::deleteVehiclePermanently', appError);
      throw appError;
    }
  }

  async getVehicleById(id: number): Promise<VehicleFullDetails> {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              status: true,
              image: true,
              phoneNumber: true,
              companyName: true,
            },
          },
          trackingDevices: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
              firmwareVersion: true,
              communicationProtocol: true,
            },
          },
          emissionData: { orderBy: { timestamp: 'desc' }, take: 20 },
          gpsData: { orderBy: { timestamp: 'desc' }, take: 20 },
          fuelData: { orderBy: { timestamp: 'desc' }, take: 20 },
          obdData: { orderBy: { timestamp: 'desc' }, take: 20 },
          alerts: { orderBy: { createdAt: 'desc' }, take: 10 },
          maintenanceRecords: true,
          connectionState: true,
        },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }

      return vehicle as VehicleFullDetails;
    } catch (error: any) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        logger.error('VehicleRepository::getVehicleById', error);
        throw error;
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::getVehicleById', appError);
        throw appError;
      }

      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get vehicle by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::getVehicleById', appError);
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
  }): Promise<{ data: VehicleListItemWithUser[]; pagination: PaginationMeta }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        deletedAt: null,
        // Add filters
        ...(filters.status && { status: filters.status }),
        ...(filters.emissionStatus && { emissionStatus: filters.emissionStatus }),
        ...(filters.vehicleType && { vehicleType: filters.vehicleType }),
        ...(filters.userId && { userId: filters.userId }),
      };

      // Add search functionality if search term provided
      if (search) {
        whereClause.OR = [
          { plateNumber: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { chassisNumber: { contains: search, mode: 'insensitive' } },
          { vehicleType: { contains: search, mode: 'insensitive' } },
          { vehicleModel: { contains: search, mode: 'insensitive' } },
          { fuelType: { contains: search, mode: 'insensitive' } },
          { 
            user: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ]
            }
          }
        ];
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                image: true,
                phoneNumber: true,
                companyName: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        prisma.vehicle.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: vehicles as VehicleListItemWithUser[],
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : undefined,
          prevPage: hasPrevPage ? page - 1 : undefined,
          sortBy,
          sortOrder,
        },
      };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::listVehicles', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to list vehicles',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::listVehicles', appError);
      throw appError;
    }
  }

  async getVehiclesByUser(userId: number): Promise<VehicleListItemWithUser[]> {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { userId, deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return vehicles as unknown as VehicleListItemWithUser[];
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::getVehiclesByUser', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get vehicles by user',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::getVehiclesByUser', appError);
      throw appError;
    }
  }

  async getTopPolluters(limit = 5): Promise<VehicleListItemWithUser[]> {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { deletedAt: null },
        orderBy: {
          emissionStatus: 'desc', // assuming HIGH > MEDIUM > LOW
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return vehicles as unknown as VehicleListItemWithUser[];
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::getTopPolluters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get top polluters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::getTopPolluters', appError);
      throw appError;
    }
  }

  async countVehicles(): Promise<number> {
    try {
      return await prisma.vehicle.count({ where: { deletedAt: null } });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::countVehicles', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count vehicles',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::countVehicles', appError);
      throw appError;
    }
  }

  async countVehiclesByStatus(status: VehicleStatus): Promise<number> {
    try {
      return await prisma.vehicle.count({
        where: { status, deletedAt: null },
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('VehicleRepository::countVehiclesByStatus', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count vehicles by status',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('VehicleRepository::countVehiclesByStatus', appError);
      throw appError;
    }
  }
}

export default new VehicleRepository();