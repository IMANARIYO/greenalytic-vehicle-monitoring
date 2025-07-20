import { Solution, SolutionType, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import prisma from '../../config/db.js';

interface SolutionCreateInput {
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  type: SolutionType;
}

interface SolutionUpdateInput {
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  icon?: string;
  type?: SolutionType;
}

class SolutionRepository {
  async create(data: SolutionCreateInput): Promise<Solution> {
    try {
      return await prisma.solution.create({
        data: {
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          content: data.content,
          icon: data.icon,
          type: data.type
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Solution | null> {
    try {
      return await prisma.solution.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solution by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithTestimonials(id: number): Promise<any | null> {
    try {
      return await prisma.solution.findUnique({
        where: { id },
        include: {
          testimonials: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findByIdWithTestimonials', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solution with testimonials by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findByIdWithTestimonials', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Solution[]> {
    try {
      return await prisma.solution.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all solutions',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.SolutionWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Solution[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.solution.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.solution.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solutions with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findManyWithFiltersIncludeTestimonials(
    whereClause: Prisma.SolutionWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.solution.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            testimonials: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        prisma.solution.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findManyWithFiltersIncludeTestimonials', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solutions with testimonials filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findManyWithFiltersIncludeTestimonials', appError);
      throw appError;
    }
  }

  async update(id: number, data: SolutionUpdateInput): Promise<Solution> {
    try {
      const updateData: Prisma.SolutionUpdateInput = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.type !== undefined) updateData.type = data.type;

      return await prisma.solution.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Solution> {
    try {
      return await prisma.solution.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::delete', appError);
      throw appError;
    }
  }

  async findByTitle(title: string): Promise<Solution | null> {
    try {
      return await prisma.solution.findFirst({
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
        logger.error('SolutionRepository::findByTitle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solution by title',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findByTitle', appError);
      throw appError;
    }
  }

  async findByType(type: SolutionType): Promise<Solution[]> {
    try {
      return await prisma.solution.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::findByType', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find solutions by type',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::findByType', appError);
      throw appError;
    }
  }

  async getSolutionTypes(): Promise<SolutionType[]> {
    try {
      // Return all available solution types from enum
      return Object.values(SolutionType);
    } catch (error: any) {
      const appError = new AppError(
        error.message || 'Failed to get solution types',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::getSolutionTypes', appError);
      throw appError;
    }
  }

  async getTypesInUse(): Promise<SolutionType[]> {
    try {
      const result = await prisma.solution.findMany({
        select: {
          type: true
        },
        distinct: ['type'],
        orderBy: {
          type: 'asc'
        }
      });
      
      return result.map(item => item.type);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::getTypesInUse', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get solution types in use',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::getTypesInUse', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.solution.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count solutions',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::count', appError);
      throw appError;
    }
  }

  async countByType(type: SolutionType): Promise<number> {
    try {
      return await prisma.solution.count({
        where: { type }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('SolutionRepository::countByType', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count solutions by type',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionRepository::countByType', appError);
      throw appError;
    }
  }
}

export default new SolutionRepository();