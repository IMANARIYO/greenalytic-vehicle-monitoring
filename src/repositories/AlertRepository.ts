import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import {NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

interface AlertCreateInput {
    type: string;
    title: string;
    message: string;
    triggerValue: string;
    triggerThreshold: string;
    vehicleId: number;
    userId: number;
}

export class AlertRepository {
    async createMany(alerts: AlertCreateInput[]): Promise<{ count: number }> {
        try {
            return await prisma.alert.createMany({
                data: alerts.map(alert => ({
                    type: alert.type as NotificationType,
                    title: alert.title,
                    message: alert.message,
                    triggerValue: alert.triggerValue,
                    triggerThreshold: alert.triggerThreshold,
                    vehicleId: alert.vehicleId,
                    userId: alert.userId,
                    isRead: false,
                    createdAt: new Date()
                }))
            });
        } catch (error) {
            logger.error('AlertRepository::createMany', error);
            throw error;
        }
    }
}