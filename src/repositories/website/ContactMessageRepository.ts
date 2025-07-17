import { ContactMessage, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';

interface ContactMessageCreateInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactMessageUpdateInput {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

class ContactMessageRepository {
  async create(data: ContactMessageCreateInput): Promise<ContactMessage> {
    try {
      return await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<ContactMessage | null> {
    try {
      return await prisma.contactMessage.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find contact message by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::findById', appError);
      throw appError;
    }
  }

  async findAll(): Promise<ContactMessage[]> {
    try {
      return await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.ContactMessageWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: ContactMessage[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.contactMessage.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.contactMessage.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find contact messages with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: ContactMessageUpdateInput): Promise<ContactMessage> {
    try {
      const updateData: Prisma.ContactMessageUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.message !== undefined) updateData.message = data.message;

      return await prisma.contactMessage.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<ContactMessage> {
    try {
      return await prisma.contactMessage.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::delete', appError);
      throw appError;
    }
  }

  async findByEmail(email: string): Promise<ContactMessage[]> {
    try {
      return await prisma.contactMessage.findMany({
        where: { 
          email: {
            equals: email,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::findByEmail', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find contact messages by email',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::findByEmail', appError);
      throw appError;
    }
  }

  async findRecentMessages(hours: number = 24): Promise<ContactMessage[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await prisma.contactMessage.findMany({
        where: {
          createdAt: { gte: startTime }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::findRecentMessages', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find recent contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::findRecentMessages', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.contactMessage.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::count', appError);
      throw appError;
    }
  }

  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      return await prisma.contactMessage.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ContactMessageRepository::countByDateRange', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count contact messages by date range',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageRepository::countByDateRange', appError);
      throw appError;
    }
  }
}

export default new ContactMessageRepository();