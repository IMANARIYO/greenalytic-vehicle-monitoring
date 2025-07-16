import { Feature, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';

interface FeatureCreateInput {
  title: string;
  description: string;
  icon: string;
  productId: number;
}

interface FeatureUpdateInput {
  title?: string;
  description?: string;
  icon?: string;
  productId?: number;
}

class FeatureRepository {
  async create(data: FeatureCreateInput): Promise<Feature> {
    try {
      return await prisma.feature.create({
        data: {
          title: data.title,
          description: data.description,
          icon: data.icon,
          productId: data.productId
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Feature | null> {
    try {
      return await prisma.feature.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find feature by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithProduct(id: number): Promise<any | null> {
    try {
      return await prisma.feature.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              iconBackgroundColor: true
            }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findByIdWithProduct', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find feature with product by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findByIdWithProduct', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Feature[]> {
    try {
      return await prisma.feature.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all features',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.FeatureWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Feature[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.feature.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.feature.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find features with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findManyWithFiltersIncludeProduct(
    whereClause: Prisma.FeatureWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.feature.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                iconBackgroundColor: true
              }
            }
          }
        }),
        prisma.feature.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findManyWithFiltersIncludeProduct', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find features with product filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findManyWithFiltersIncludeProduct', appError);
      throw appError;
    }
  }

  async update(id: number, data: FeatureUpdateInput): Promise<Feature> {
    try {
      const updateData: Prisma.FeatureUpdateInput = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.productId !== undefined) updateData.product = { connect: { id: data.productId } };

      return await prisma.feature.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Feature> {
    try {
      return await prisma.feature.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::delete', appError);
      throw appError;
    }
  }

  async findByTitle(title: string, productId?: number): Promise<Feature | null> {
    try {
      const whereClause: Prisma.FeatureWhereInput = {
        title: {
          equals: title,
          mode: 'insensitive'
        }
      };

      if (productId) {
        whereClause.productId = productId;
      }

      return await prisma.feature.findFirst({
        where: whereClause
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findByTitle', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find feature by title',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findByTitle', appError);
      throw appError;
    }
  }

  async findByProductId(productId: number): Promise<Feature[]> {
    try {
      return await prisma.feature.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::findByProductId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find features by product ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::findByProductId', appError);
      throw appError;
    }
  }


  async count(): Promise<number> {
    try {
      return await prisma.feature.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('FeatureRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count features',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureRepository::count', appError);
      throw appError;
    }
  }
}

export default new FeatureRepository();