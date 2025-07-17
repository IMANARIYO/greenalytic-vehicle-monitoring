import { PartnershipReason, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';

interface PartnershipReasonCreateInput {
  title: string;
  description: string;
  icon: string;
}

interface PartnershipReasonUpdateInput {
  title?: string;
  description?: string;
  icon?: string;
}

class PartnershipReasonRepository {
  async create(data: PartnershipReasonCreateInput): Promise<PartnershipReason> {
    try {
      return await prisma.partnershipReason.create({
        data: {
          title: data.title,
          description: data.description,
          icon: data.icon
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<PartnershipReason | null> {
    try {
      return await prisma.partnershipReason.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partnership reason by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::findById', appError);
      throw appError;
    }
  }

  async findAll(): Promise<PartnershipReason[]> {
    try {
      return await prisma.partnershipReason.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all partnership reasons',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.PartnershipReasonWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: PartnershipReason[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.partnershipReason.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.partnershipReason.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partnership reasons with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: PartnershipReasonUpdateInput): Promise<PartnershipReason> {
    try {
      const updateData: Prisma.PartnershipReasonUpdateInput = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;

      return await prisma.partnershipReason.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<PartnershipReason> {
    try {
      return await prisma.partnershipReason.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::delete', appError);
      throw appError;
    }
  }

  async findByTitle(title: string): Promise<PartnershipReason | null> {
    try {
      return await prisma.partnershipReason.findFirst({
        where: { 
          title: {
            equals: title,
            mode: 'insensitive'
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::findByTitle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partnership reason by title',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::findByTitle', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.partnershipReason.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnershipReasonRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count partnership reasons',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonRepository::count', appError);
      throw appError;
    }
  }
}

export default new PartnershipReasonRepository();