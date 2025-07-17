import { AdvisoryBoard, Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';
import { SocialLinks } from '../../types/webiste/dtos/AdvisoryBoardDto';

interface AdvisoryBoardCreateInput {
  name: string;
  position: string;
  company: string;
  highlight?: string;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  fullBioLink?: string;
}

interface AdvisoryBoardUpdateInput {
  name?: string;
  position?: string;
  company?: string;
  highlight?: string;
  description?: string;
  imageUrl?: string;
  socialLinks?: SocialLinks;
  fullBioLink?: string;
}

class AdvisoryBoardRepository {
  async create(data: AdvisoryBoardCreateInput): Promise<AdvisoryBoard> {
    try {
      return await prisma.advisoryBoard.create({
        data: {
          name: data.name,
          position: data.position,
          company: data.company,
          highlight: data.highlight || null,
          description: data.description,
          imageUrl: data.imageUrl,
          socialLinks: data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null,
          fullBioLink: data.fullBioLink || null
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<AdvisoryBoard | null> {
    try {
      return await prisma.advisoryBoard.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find advisory board member by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::findById', appError);
      throw appError;
    }
  }

  async findAll(): Promise<AdvisoryBoard[]> {
    try {
      return await prisma.advisoryBoard.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all advisory board members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.AdvisoryBoardWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: AdvisoryBoard[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.advisoryBoard.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.advisoryBoard.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find advisory board members with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: AdvisoryBoardUpdateInput): Promise<AdvisoryBoard> {
    try {
      const updateData: Prisma.AdvisoryBoardUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.highlight !== undefined) updateData.highlight = data.highlight;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null;
      if (data.fullBioLink !== undefined) updateData.fullBioLink = data.fullBioLink;

      return await prisma.advisoryBoard.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<AdvisoryBoard> {
    try {
      return await prisma.advisoryBoard.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::delete', appError);
      throw appError;
    }
  }

  async findByCompany(company: string): Promise<AdvisoryBoard[]> {
    try {
      return await prisma.advisoryBoard.findMany({
        where: { 
          company: {
            contains: company,
            mode: 'insensitive'
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::findByCompany', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find advisory board members by company',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::findByCompany', appError);
      throw appError;
    }
  }

  async findByNameAndCompany(name: string, company: string): Promise<AdvisoryBoard | null> {
    try {
      return await prisma.advisoryBoard.findFirst({
        where: { 
          AND: [
            {
              name: {
                equals: name,
                mode: 'insensitive'
              }
            },
            {
              company: {
                equals: company,
                mode: 'insensitive'
              }
            }
          ]
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::findByNameAndCompany', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find advisory board member by name and company',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::findByNameAndCompany', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.advisoryBoard.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('AdvisoryBoardRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count advisory board members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardRepository::count', appError);
      throw appError;
    }
  }
}

export default new AdvisoryBoardRepository();