import { Technology, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';

interface TechnologyCreateInput {
  name: string;
  description: string;
  icon: string;
}

interface TechnologyUpdateInput {
  name?: string;
  description?: string;
  icon?: string;
}

class TechnologyRepository {
  async create(data: TechnologyCreateInput): Promise<Technology> {
    try {
      return await prisma.technology.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Technology | null> {
    try {
      return await prisma.technology.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find technology by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::findById', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Technology[]> {
    try {
      return await prisma.technology.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all technologies',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.TechnologyWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Technology[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.technology.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.technology.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find technologies with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: TechnologyUpdateInput): Promise<Technology> {
    try {
      const updateData: Prisma.TechnologyUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;

      return await prisma.technology.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Technology> {
    try {
      return await prisma.technology.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::delete', appError);
      throw appError;
    }
  }

  async findByName(name: string): Promise<Technology | null> {
    try {
      return await prisma.technology.findFirst({
        where: { 
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::findByName', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find technology by name',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::findByName', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.technology.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TechnologyRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count technologies',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyRepository::count', appError);
      throw appError;
    }
  }
}

export default new TechnologyRepository();