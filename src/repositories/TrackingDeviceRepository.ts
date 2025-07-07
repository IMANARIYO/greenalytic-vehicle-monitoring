import { TrackingDevice, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { PaginationMeta, PaginationParams } from '../types/GrobalTypes';
import prisma from '../config/db';

class TrackingDeviceRepository {
    async findById(id: number): Promise<TrackingDevice | null> {
        try {
            return await prisma.trackingDevice.findUnique({
                where: { id }
            });
        } catch (error) {
            logger.error('TrackingDeviceRepository::findById', error);
            throw error;
        }
    }

    async updateLastPing(id: number): Promise<TrackingDevice> {
        try {
            return await prisma.trackingDevice.update({
                where: { id },
                data: {
                    lastPing: new Date(),
                    status: 'ACTIVE',
                    isActive: true,
                }
            });
        } catch (error) {
            logger.error('TrackingDeviceRepository::updateLastPing', error);
            throw error;
        }
    }
}

export default TrackingDeviceRepository;