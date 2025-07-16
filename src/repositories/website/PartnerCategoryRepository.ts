import { PartnerCategory, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';

interface PartnerCategoryCreateInput {
  name: string;
  icon: string;
}

interface PartnerCategoryUpdateInput {
  name?: string;
  icon?: string;
}

interface PartnerCategoryWithPartnersCount extends PartnerCategory {
  _count: {
    partners: number;
  };
}

interface PartnerCategoryWithPartners extends PartnerCategory {
  partners: {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string | null;
    keyImpact: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

class PartnerCategoryRepository {
  async create(data: PartnerCategoryCreateInput): Promise<PartnerCategory> {
    try {
      return await prisma.partnerCategory.create({
        data: {
          name: data.name,
          icon: data.icon
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<PartnerCategory | null> {
    try {
      return await prisma.partnerCategory.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner category by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithPartners(id: number): Promise<PartnerCategoryWithPartners | null> {
    try {
      return await prisma.partnerCategory.findUnique({
        where: { id },
        include: {
          partners: {
            select: {
              id: true,
              name: true,
              description: true,
              logoUrl: true,
              websiteUrl: true,
              keyImpact: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: { name: 'asc' }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::findByIdWithPartners', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner category with partners',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::findByIdWithPartners', appError);
      throw appError;
    }
  }

  async findAll(): Promise<PartnerCategory[]> {
    try {
      return await prisma.partnerCategory.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all partner categories',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.PartnerCategoryWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    includePartnersCount: boolean = false
  ): Promise<{ data: (PartnerCategory | PartnerCategoryWithPartnersCount)[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const includeOptions = includePartnersCount ? {
        _count: {
          select: { partners: true }
        }
      } : undefined;

      const [data, totalCount] = await Promise.all([
        prisma.partnerCategory.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: includeOptions
        }),
        prisma.partnerCategory.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner categories with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: PartnerCategoryUpdateInput): Promise<PartnerCategory> {
    try {
      const updateData: Prisma.PartnerCategoryUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.icon !== undefined) updateData.icon = data.icon;

      return await prisma.partnerCategory.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<PartnerCategory> {
    try {
      // Check if category has partners before deletion
      const partnersCount = await prisma.partner.count({
        where: { categoryId: id }
      });

      if (partnersCount > 0) {
        throw new AppError(
          `Cannot delete partner category with ${partnersCount} partners. Please move or delete partners first.`,
          HttpStatusCode.CONFLICT
        );
      }

      return await prisma.partnerCategory.delete({
        where: { id }
      });
    } catch (error: any) {
      // If it's already an AppError (from business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryRepository::delete', error);
        throw error;
      }

      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::delete', appError);
      throw appError;
    }
  }

  async findByName(name: string): Promise<PartnerCategory | null> {
    try {
      return await prisma.partnerCategory.findFirst({
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
        logger.error('PartnerCategoryRepository::findByName', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find partner category by name',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::findByName', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.partnerCategory.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count partner categories',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::count', appError);
      throw appError;
    }
  }

  async getPartnersCount(categoryId: number): Promise<number> {
    try {
      return await prisma.partner.count({
        where: { categoryId }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('PartnerCategoryRepository::getPartnersCount', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count partners in category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryRepository::getPartnersCount', appError);
      throw appError;
    }
  }
}

export default new PartnerCategoryRepository();