import { Product, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import prisma from '../../config/db.js';

interface ProductCreateInput {
  name: string;
  description: string;
  content: string;
  icon: string;
  iconBackgroundColor: string;
}

interface ProductUpdateInput {
  name?: string;
  description?: string;
  content?: string;
  icon?: string;
  iconBackgroundColor?: string;
 
}

class ProductRepository {
  async create(data: ProductCreateInput): Promise<Product> {
    try {
      return await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          content: data.content,
          icon: data.icon,
          iconBackgroundColor: data.iconBackgroundColor,
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find product by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithFeatures(id: number): Promise<any | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: {
          features: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::findByIdWithFeatures', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find product with features by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::findByIdWithFeatures', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all products',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.ProductWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Product[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.product.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find products with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: ProductUpdateInput): Promise<Product> {
    try {
      const updateData: Prisma.ProductUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.iconBackgroundColor !== undefined) updateData.iconBackgroundColor = data.iconBackgroundColor;
      

      return await prisma.product.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Product> {
    try {
      return await prisma.product.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::delete', appError);
      throw appError;
    }
  }

  async findByName(name: string): Promise<Product | null> {
    try {
      return await prisma.product.findFirst({
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
        logger.error('ProductRepository::findByName', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find product by name',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::findByName', appError);
      throw appError;
    }
  }


  async count(): Promise<number> {
    try {
      return await prisma.product.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('ProductRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count products',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductRepository::count', appError);
      throw appError;
    }
  }
}

export default new ProductRepository();