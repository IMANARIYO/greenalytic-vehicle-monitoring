import { Testimonial, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import prisma from '../../config/db.js';

interface TestimonialCreateInput {
  name: string;
  position: string;
  company: string;
  content: string;
  imageUrl?: string;
  solutionId: number;
}

interface TestimonialUpdateInput {
  name?: string;
  position?: string;
  company?: string;
  content?: string;
  imageUrl?: string;
  solutionId?: number;
}

class TestimonialRepository {
  async create(data: TestimonialCreateInput): Promise<Testimonial> {
    try {
      return await prisma.testimonial.create({
        data: {
          name: data.name,
          position: data.position,
          company: data.company,
          content: data.content,
          imageUrl: data.imageUrl || null,
          solutionId: data.solutionId
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Testimonial | null> {
    try {
      return await prisma.testimonial.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonial by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithSolution(id: number): Promise<any | null> {
    try {
      return await prisma.testimonial.findUnique({
        where: { id },
        include: {
          usedSolution: {
            select: {
              id: true,
              title: true,
              subtitle: true,
              type: true,
              icon: true
            }
          }
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findByIdWithSolution', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonial with solution by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findByIdWithSolution', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Testimonial[]> {
    try {
      return await prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all testimonials',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.TestimonialWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Testimonial[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.testimonial.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.testimonial.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonials with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findManyWithFiltersIncludeSolution(
    whereClause: Prisma.TestimonialWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.testimonial.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            usedSolution: {
              select: {
                id: true,
                title: true,
                subtitle: true,
                type: true,
                icon: true
              }
            }
          }
        }),
        prisma.testimonial.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findManyWithFiltersIncludeSolution', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonials with solution filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findManyWithFiltersIncludeSolution', appError);
      throw appError;
    }
  }

  async update(id: number, data: TestimonialUpdateInput): Promise<Testimonial> {
    try {
      const updateData: Prisma.TestimonialUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
      if (data.solutionId !== undefined) {
        updateData.usedSolution = { connect: { id: data.solutionId } };
      }

      return await prisma.testimonial.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Testimonial> {
    try {
      return await prisma.testimonial.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::delete', appError);
      throw appError;
    }
  }

  async findBySolutionId(solutionId: number): Promise<Testimonial[]> {
    try {
      return await prisma.testimonial.findMany({
        where: { solutionId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findBySolutionId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonials by solution ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findBySolutionId', appError);
      throw appError;
    }
  }

  async findByCompany(company: string): Promise<Testimonial[]> {
    try {
      return await prisma.testimonial.findMany({
        where: { 
          company: {
            equals: company,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::findByCompany', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find testimonials by company',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::findByCompany', appError);
      throw appError;
    }
  }

  async getUniqueCompanies(): Promise<string[]> {
    try {
      const result = await prisma.testimonial.findMany({
        select: {
          company: true
        },
        distinct: ['company'],
        orderBy: {
          company: 'asc'
        }
      });
      
      return result.map(item => item.company);
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::getUniqueCompanies', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to get unique companies',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::getUniqueCompanies', appError);
      throw appError;
    }
  }

  async countBySolutionId(solutionId: number): Promise<number> {
    try {
      return await prisma.testimonial.count({
        where: { solutionId }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::countBySolutionId', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count testimonials by solution ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::countBySolutionId', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.testimonial.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TestimonialRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count testimonials',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialRepository::count', appError);
      throw appError;
    }
  }
}

export default new TestimonialRepository();