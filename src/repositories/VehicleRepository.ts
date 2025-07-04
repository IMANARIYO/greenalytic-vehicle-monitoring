import { PrismaClient, VehicleStatus, EmissionStatus, Vehicle } from '@prisma/client';
import { VehicleCreateRequest, VehicleUpdateRequest, VehicleFullDetails, VehicleListItemWithUser } from '../types/VehicleTypes';
import logger from '../utils/logger';
import { PaginationMeta, PaginationParams } from '../types/GrobalTypes';

const prisma = new PrismaClient();

export class VehicleRepository {
  async createVehicle(data: VehicleCreateRequest): Promise<Vehicle> {
    try {
      return await prisma.vehicle.create({ data });
    } catch (error) {
      logger.error('VehicleRepository::createVehicle', error);
      throw error;
    }
  }
  async updateVehicle(id: number, data: VehicleUpdateRequest): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('VehicleRepository::updateVehicle', error);
      throw error;
    }
  }
  async softDeleteVehicle(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      logger.error('VehicleRepository::softDeleteVehicle', error);
      throw error;
    }
  }
  async restoreVehicle(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error) {
      logger.error('VehicleRepository::restoreVehicle', error);
      throw error;
    }
  }
  async deleteVehiclePermanently(id: number): Promise<Vehicle> {
    try {
      return await prisma.vehicle.delete({ where: { id } });
    } catch (error) {
      logger.error('VehicleRepository::deleteVehiclePermanently', error);
      throw error;
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
          emissionData: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
          gpsData: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
          fuelData: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
          obdData: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
          alerts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          maintenanceRecords: true,
          connectionState: true,
        },
      });

      if (!vehicle) throw new Error('Vehicle not found');
      return vehicle as unknown as VehicleFullDetails;
    } catch (error) {
      logger.error('VehicleRepository::getVehicleById', error);
      throw error;
    }
  }
  async listVehicles(params: PaginationParams & {
    filter?: {
      status?: VehicleStatus;
      emissionStatus?: EmissionStatus;
      vehicleType?: string;
      userId?: number;
    };
    sortBy?: keyof Vehicle;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: VehicleListItemWithUser[]; meta: PaginationMeta }> {
    try {
      const {
        page = 1,
        limit = 10,
        filter = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;
  
      const skip = (page - 1) * limit;
  
      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where: {
            deletedAt: null,
            ...(filter.status && { status: filter.status }),
            ...(filter.emissionStatus && { emissionStatus: filter.emissionStatus }),
            ...(filter.vehicleType && { vehicleType: filter.vehicleType }),
            ...(filter.userId && { userId: filter.userId }),
          },
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
          where: {
            deletedAt: null,
            ...(filter.status && { status: filter.status }),
            ...(filter.emissionStatus && { emissionStatus: filter.emissionStatus }),
            ...(filter.vehicleType && { vehicleType: filter.vehicleType }),
            ...(filter.userId && { userId: filter.userId }),
          },
        }),
      ]);
  
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
  
      return {
        data: vehicles as VehicleListItemWithUser[],
        meta: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      logger.error('VehicleRepository::listVehicles', error);
      throw error;
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
    } catch (error) {
      logger.error('VehicleRepository::getVehiclesByUser', error);
      throw error;
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
    } catch (error) {
      logger.error('VehicleRepository::getTopPolluters', error);
      throw error;
    }
  }
  async countVehicles(): Promise<number> {
    try {
      return await prisma.vehicle.count({ where: { deletedAt: null } });
    } catch (error) {
      logger.error('VehicleRepository::countVehicles', error);
      throw error;
    }
  }
  async countVehiclesByStatus(status: VehicleStatus): Promise<number> {
        try {
        return await prisma.vehicle.count({
            where: { status, deletedAt: null },
        });
        } catch (error) {
        logger.error('VehicleRepository::countVehiclesByStatus', error);
        throw error;
        }
}
      
}
