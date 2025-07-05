import { PrismaClient, TrackingDevice, DeviceHeartbeat, Prisma, ConnectionStatus, DeviceCategory } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, handlePrismaError, NotFoundError } from '../middlewares/errorHandler';
import prisma from '../config/db';

/**
 * Repository for handling all database operations related to Tracking Devices
 */
class TrackingDeviceRepository {
    
  /**
   * Finds a tracking device by serial number
   */
  async findBySerialNumber(serialNumber: string): Promise<TrackingDevice | null> {
    return await prisma.trackingDevice.findUnique({ where: { serialNumber } });
  }

  /**
   * Finds device category conflict for a vehicle
   */
  async findDeviceCategoryConflict(vehicleId: number, category: DeviceCategory): Promise<TrackingDevice | null> {
    return await prisma.trackingDevice.findFirst({
      where: {
        vehicleId,
        deviceCategory: category,
        deletedAt: null,
        status: { not: 'INACTIVE' },
      },
    });
  }

  /**
   * Creates a new tracking device
   * @param deviceData - Data for the new device
   * @returns Promise<TrackingDevice>
   */
  async createTrackingDevice(
    deviceData: Prisma.TrackingDeviceCreateInput
  ): Promise<TrackingDevice> {
    try {
      logger.info('Creating new tracking device');
      return await prisma.trackingDevice.create({
        data: deviceData
      });
    } catch (error) {
      logger.error('Failed to create tracking device', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to create tracking device');
    }
  }

  /**
   * Updates device information
   * @param deviceId - ID of the device to update
   * @param updateData - Data to update
   * @returns Promise<TrackingDevice>
   */
  async updateTrackingDevice(
    deviceId: number,
    updateData: Prisma.TrackingDeviceUpdateInput
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Updating tracking device with ID: ${deviceId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: updateData
      });
    } catch (error) {
      logger.error(`Failed to update tracking device with ID: ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to update tracking device');
    }
  }

  /**
   * Soft deletes a device
   * @param deviceId - ID of the device to soft delete
   * @returns Promise<TrackingDevice>
   */
  async softDeleteTrackingDevice(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Soft deleting tracking device with ID: ${deviceId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { deletedAt: new Date() }
      });
    } catch (error) {
      logger.error(`Failed to soft delete tracking device with ID: ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to soft delete tracking device');
    }
  }

  /**
   * Restores a soft-deleted device
   * @param deviceId - ID of the device to restore
   * @returns Promise<TrackingDevice>
   */
  async restoreTrackingDevice(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Restoring tracking device with ID: ${deviceId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { deletedAt: null }
      });
    } catch (error) {
      logger.error(`Failed to restore tracking device with ID: ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to restore tracking device');
    }
  }

  /**
   * Permanently deletes a device
   * @param deviceId - ID of the device to delete
   * @returns Promise<TrackingDevice>
   */
  async hardDeleteTrackingDevice(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Hard deleting tracking device with ID: ${deviceId}`);
      return await prisma.trackingDevice.delete({
        where: { id: deviceId }
      });
    } catch (error) {
      logger.error(`Failed to hard delete tracking device with ID: ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to hard delete tracking device');
    }
  }

  /**
   * Retrieves a device by its ID
   * @param deviceId - ID of the device to retrieve
   * @returns Promise<TrackingDevice>
   */
  async getTrackingDeviceById(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Fetching tracking device with ID: ${deviceId}`);
      const device = await prisma.trackingDevice.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        throw new NotFoundError('TrackingDevice');
      }

      return device;
    } catch (error) {
      logger.error(`Failed to fetch tracking device with ID: ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw error; // Re-throw NotFoundError
    }
  }

  /**
   * Lists devices with pagination and filtering
   * @param options - Pagination and filtering options
   * @returns Promise<TrackingDevice[]>
   */
  async listTrackingDevices(options: {
    skip?: number;
    take?: number;
    where?: Prisma.TrackingDeviceWhereInput;
    orderBy?: Prisma.TrackingDeviceOrderByWithRelationInput;
  }): Promise<TrackingDevice[]> {
    try {
      logger.info('Listing tracking devices with options', { options });
      return await prisma.trackingDevice.findMany({
        skip: options.skip,
        take: options.take,
        where: options.where,
        orderBy: options.orderBy
      });
    } catch (error) {
      logger.error('Failed to list tracking devices', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to list tracking devices');
    }
  }

  /**
   * Assigns a device to a vehicle
   * @param deviceId - ID of the device to assign
   * @param vehicleId - ID of the vehicle to assign to
   * @returns Promise<TrackingDevice>
   */
  async assignDeviceToVehicle(
    deviceId: number,
    vehicleId: number
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Assigning device ${deviceId} to vehicle ${vehicleId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { vehicleId }
      });
    } catch (error) {
      logger.error(`Failed to assign device ${deviceId} to vehicle ${vehicleId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to assign device to vehicle');
    }
  }

  /**
   * Unassigns a device from its current vehicle
   * @param deviceId - ID of the device to unassign
   * @returns Promise<TrackingDevice>
   */
  async unassignDeviceFromVehicle(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Unassigning device ${deviceId} from vehicle`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { vehicleId: null }
      });
    } catch (error) {
      logger.error(`Failed to unassign device ${deviceId} from vehicle`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to unassign device from vehicle');
    }
  }

  /**
   * Assigns a device to a user
   * @param deviceId - ID of the device to assign
   * @param userId - ID of the user to assign to
   * @returns Promise<TrackingDevice>
   */
  async assignDeviceToUser(
    deviceId: number,
    userId: number
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Assigning device ${deviceId} to user ${userId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { userId }
      });
    } catch (error) {
      logger.error(`Failed to assign device ${deviceId} to user ${userId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to assign device to user');
    }
  }

  /**
   * Unassigns a device from its current user
   * @param deviceId - ID of the device to unassign
   * @returns Promise<TrackingDevice>
   */
  async unassignDeviceFromUser(deviceId: number): Promise<TrackingDevice> {
    try {
      logger.info(`Unassigning device ${deviceId} from user`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { userId: null }
      });
    } catch (error) {
      logger.error(`Failed to unassign device ${deviceId} from user`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to unassign device from user');
    }
  }

  /**
   * Reassigns a device to a different vehicle
   * @param deviceId - ID of the device to reassign
   * @param newVehicleId - ID of the new vehicle
   * @returns Promise<TrackingDevice>
   */
  async reassignDeviceToVehicle(
    deviceId: number,
    newVehicleId: number
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Reassigning device ${deviceId} to vehicle ${newVehicleId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { vehicleId: newVehicleId }
      });
    } catch (error) {
      logger.error(`Failed to reassign device ${deviceId} to vehicle ${newVehicleId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to reassign device to vehicle');
    }
  }

  /**
   * Reassigns a device to a different user
   * @param deviceId - ID of the device to reassign
   * @param newUserId - ID of the new user
   * @returns Promise<TrackingDevice>
   */
  async reassignDeviceToUser(
    deviceId: number,
    newUserId: number
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Reassigning device ${deviceId} to user ${newUserId}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { userId: newUserId }
      });
    } catch (error) {
      logger.error(`Failed to reassign device ${deviceId} to user ${newUserId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to reassign device to user');
    }
  }

  /**
   * Updates device status
   * @param deviceId - ID of the device to update
   * @param status - New status
   * @returns Promise<TrackingDevice>
   */
  async updateDeviceStatus(
    deviceId: number,
    status: Prisma.EnumDeviceStatusFieldUpdateOperationsInput
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Updating status for device ${deviceId} to ${status}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { status }
      });
    } catch (error) {
      logger.error(`Failed to update status for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to update device status');
    }
  }

  /**
   * Records a device heartbeat
   * @param deviceId - ID of the device
   * @param status - Connection status
   * @returns Promise<DeviceHeartbeat>
   */
  async recordDeviceHeartbeat(
    deviceId: number,
    status: ConnectionStatus
  ): Promise<DeviceHeartbeat> {
    try {
      logger.info(`Recording heartbeat for device ${deviceId} with status ${status}`);
  
      await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { lastPing: new Date() },
      });
  
      return await prisma.deviceHeartbeat.create({
        data: {
          deviceId,
          status,
        },
      });
    } catch (error) {
      logger.error(`Failed to record heartbeat for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to record device heartbeat');
    }
  }

  /**
   * Retrieves heartbeat logs for a device
   * @param deviceId - ID of the device
   * @param options - Pagination options
   * @returns Promise<DeviceHeartbeat[]>
   */
  async getDeviceHeartbeats(
    deviceId: number,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.DeviceHeartbeatOrderByWithRelationInput;
    }
  ): Promise<DeviceHeartbeat[]> {
    try {
      logger.info(`Fetching heartbeats for device ${deviceId}`);
      return await prisma.deviceHeartbeat.findMany({
        where: { deviceId },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy
      });
    } catch (error) {
      logger.error(`Failed to fetch heartbeats for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to fetch device heartbeats');
    }
  }

  /**
   * Retrieves devices with last ping older than specified timestamp
   * @param timestamp - Cutoff timestamp
   * @returns Promise<TrackingDevice[]>
   */
  async getDevicesWithLastPingOlderThan(
    timestamp: Date
  ): Promise<TrackingDevice[]> {
    try {
      logger.info(`Fetching devices with last ping older than ${timestamp}`);
      return await prisma.trackingDevice.findMany({
        where: {
          lastPing: {
            lt: timestamp
          }
        }
      });
    } catch (error) {
      logger.error('Failed to fetch offline devices', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to fetch offline devices');
    }
  }

  /**
   * Counts online devices
   * @param threshold - Time threshold for considering device online
   * @returns Promise<number>
   */
  async getOnlineDevicesCount(threshold: Date): Promise<number> {
    try {
      logger.info('Counting online devices');
      return await prisma.trackingDevice.count({
        where: {
          lastPing: {
            gte: threshold
          },
          status: 'ACTIVE'
        }
      });
    } catch (error) {
      logger.error('Failed to count online devices', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to count online devices');
    }
  }

  /**
   * Retrieves device connection statistics
   * @returns Promise<{ status: string; count: number }[]>
   */
  async getDeviceConnectionStats(): Promise<
    { status: string; count: number }[]
  > {
    try {
      logger.info('Fetching device connection stats');
      return await prisma.trackingDevice.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }).then(results =>
        results.map(result => ({
          status: result.status,
          count: result._count.status
        }))
      );
    } catch (error) {
      logger.error('Failed to fetch device connection stats', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to fetch device connection stats');
    }
  }

  /**
   * Updates firmware version for a device
   * @param deviceId - ID of the device
   * @param version - New firmware version
   * @returns Promise<TrackingDevice>
   */
  async updateFirmwareVersion(
    deviceId: number,
    version: string
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Updating firmware version for device ${deviceId} to ${version}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { firmwareVersion: version }
      });
    } catch (error) {
      logger.error(`Failed to update firmware version for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to update firmware version');
    }
  }

  /**
   * Updates data transmission interval for a device
   * @param deviceId - ID of the device
   * @param interval - New transmission interval
   * @returns Promise<TrackingDevice>
   */
  async updateDataTransmissionInterval(
    deviceId: number,
    interval: string
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Updating data transmission interval for device ${deviceId} to ${interval}`);
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: { dataTransmissionInterval: interval }
      });
    } catch (error) {
      logger.error(`Failed to update data transmission interval for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to update data transmission interval');
    }
  }

  /**
   * Toggles device monitoring features
   * @param deviceId - ID of the device
   * @param features - Features to toggle
   * @returns Promise<TrackingDevice>
   */
  async toggleDeviceFeatures(
    deviceId: number,
    features: {
      enableOBDMonitoring?: boolean;
      enableGPSTracking?: boolean;
      enableEmissionMonitoring?: boolean;
      enableFuelMonitoring?: boolean;
    }
  ): Promise<TrackingDevice> {
    try {
      logger.info(`Toggling features for device ${deviceId}`, { features });
      return await prisma.trackingDevice.update({
        where: { id: deviceId },
        data: features
      });
    } catch (error) {
      logger.error(`Failed to toggle features for device ${deviceId}`, { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to toggle device features');
    }
  }

  /**
   * Counts devices by status
   * @returns Promise<{ status: string; count: number }[]>
   */
  async countDevicesByStatus(): Promise<{ status: string; count: number }[]> {
    try {
      logger.info('Counting devices by status');
      return await prisma.trackingDevice.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }).then(results =>
        results.map(result => ({
          status: result.status,
          count: result._count.status
        }))
      );
    } catch (error) {
      logger.error('Failed to count devices by status', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to count devices by status');
    }
  }

  /**
   * Counts devices by category
   * @returns Promise<{ category: string; count: number }[]>
   */
  async countDevicesByCategory(): Promise<{ category: string; count: number }[]> {
    try {
      logger.info('Counting devices by category');
      return await prisma.trackingDevice.groupBy({
        by: ['deviceCategory'],
        _count: {
          deviceCategory: true
        }
      }).then(results =>
        results.map(result => ({
          category: result.deviceCategory,
          count: result._count.deviceCategory
        }))
      );
    } catch (error) {
      logger.error('Failed to count devices by category', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to count devices by category');
    }
  }

  /**
   * Retrieves faulty devices
   * @returns Promise<TrackingDevice[]>
   */
  async getFaultyDevices(): Promise<TrackingDevice[]> {
    try {
      logger.info('Fetching faulty devices');
      return await prisma.trackingDevice.findMany({
        where: {
          OR: [
            { batteryLevel: { lt: 20 } },
            { signalStrength: { lt: 2 } },
            { status: 'MAINTENANCE' }
          ]
        }
      });
    } catch (error) {
      logger.error('Failed to fetch faulty devices', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to fetch faulty devices');
    }
  }

  /**
   * Retrieves device data for reporting
   * @param options - Filtering options
   * @returns Promise<TrackingDevice[]>
   */
  async getDevicesForReport(options: {
    where?: Prisma.TrackingDeviceWhereInput;
    select?: Prisma.TrackingDeviceSelect;
  }): Promise<TrackingDevice[]> {
    try {
      logger.info('Fetching devices for report');
      return await prisma.trackingDevice.findMany({
        where: options.where,
        select: options.select
      });
    } catch (error) {
      logger.error('Failed to fetch devices for report', { error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to fetch devices for report');
    }
  }

} // This closing brace was missing!

export default new TrackingDeviceRepository();