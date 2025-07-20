import { Partner, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import prisma from '../../config/db.js';

interface PartnerCreateInput {
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl?: string;
  categoryId: number;
  keyImpact?: string;
}

interface PartnerUpdateInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  categoryId?: number;
  keyImpact?: string;
}

interface PartnerWithCategory extends Partner {
  category: {
    id: number;
    name: string;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface PartnerWithCategorySelect extends Partner {
  category: {
    id: number;
    name: string;
    icon: string;
  };
}

class PartnerRepository {
  async create(data: PartnerCreateInput): Promise<Partner> {
    try {
      return await prisma.partner.create({
        data: {
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl || null,
          categoryId: data.categoryId,
          keyImpact: data.keyImpact || null
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Partner | null> {
    try {
      return await prisma.partner.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithCategory(id: number): Promise<PartnerWithCategory | null> {
    try {
      return await prisma.partner.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findByIdWithCategory', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner with category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findByIdWithCategory', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Partner[]> {
    try {
      return await prisma.partner.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all partners',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.PartnerWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    includeCategory: boolean = false
  ): Promise<{ data: (Partner | PartnerWithCategorySelect)[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const includeOptions = includeCategory ? {
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      } : undefined;

      const [data, totalCount] = await Promise.all([
        prisma.partner.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: includeOptions
        }),
        prisma.partner.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partners with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: PartnerUpdateInput): Promise<Partner> {
    try {
      const updateData: Prisma.PartnerUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
      if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
      if (data.categoryId !== undefined) {
        updateData.category = {
          connect: { id: data.categoryId }
        };
      }
      if (data.keyImpact !== undefined) updateData.keyImpact = data.keyImpact;

      return await prisma.partner.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Partner> {
    try {
      return await prisma.partner.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::delete', appError);
      throw appError;
    }
  }

  async findByCategoryId(categoryId: number): Promise<Partner[]> {
    try {
      return await prisma.partner.findMany({
        where: { categoryId },
        orderBy: { name: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findByCategoryId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partners by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findByCategoryId', appError);
      throw appError;
    }
  }

  async findByNameAndCategory(name: string, categoryId: number): Promise<Partner | null> {
    try {
      return await prisma.partner.findFirst({
        where: { 
          AND: [
            {
              name: {
                equals: name,
                mode: 'insensitive'
              }
            },
            {
              categoryId: categoryId
            }
          ]
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::findByNameAndCategory', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner by name and category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::findByNameAndCategory', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.partner.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count partners',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::count', appError);
      throw appError;
    }
  }

  async countByCategory(categoryId: number): Promise<number> {
    try {
      return await prisma.partner.count({
        where: { categoryId }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::countByCategory', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count partners by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::countByCategory', appError);
      throw appError;
    }
  }

  // Validate that category exists before creating/updating partner
  async validateCategoryExists(categoryId: number): Promise<boolean> {
    try {
      const category = await prisma.partnerCategory.findUnique({
        where: { id: categoryId }
      });
      return !!category;
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerRepository::validateCategoryExists', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to validate partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerRepository::validateCategoryExists', appError);
      throw appError;
    }
  }
}

export default new PartnerRepository();