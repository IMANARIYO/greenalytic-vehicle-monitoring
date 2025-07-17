import { Team, Prisma, Department } from '@prisma/client';
import logger from '../../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler';
import prisma from '../../config/db';
import { SocialLinks } from '../../types/webiste/dtos/TeamDto';

interface TeamCreateInput {
  name: string;
  position: string;
  department: Department;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  experienceYears?: number;
  location?: string;
  profileUrl?: string;
}

interface TeamUpdateInput {
  name?: string;
  position?: string;
  department?: Department;
  description?: string;
  imageUrl?: string;
  socialLinks?: SocialLinks;
  experienceYears?: number;
  location?: string;
  profileUrl?: string;
}

class TeamRepository {
  async create(data: TeamCreateInput): Promise<Team> {
    try {
      return await prisma.team.create({
        data: {
          name: data.name,
          position: data.position,
          department: data.department,
          description: data.description,
          imageUrl: data.imageUrl,
          socialLinks: data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null,
          experienceYears: data.experienceYears || null,
          location: data.location || null,
          profileUrl: data.profileUrl || null
        }
      });
    } catch (error: any) {
      // Handle known Prisma errors with your AppError system
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::create', appError);
        throw appError;
      }
      // For other errors, wrap or rethrow as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<Team | null> {
    try {
      return await prisma.team.findUnique({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::findById', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find team member by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::findById', appError);
      throw appError;
    }
  }

  async findAll(): Promise<Team[]> {
    try {
      return await prisma.team.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::findAll', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find all team members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.TeamWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Team[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.team.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.team.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::findManyWithFilters', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find team members with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async update(id: number, data: TeamUpdateInput): Promise<Team> {
    try {
      const updateData: Prisma.TeamUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks ? JSON.parse(JSON.stringify(data.socialLinks)) : null;
      if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.profileUrl !== undefined) updateData.profileUrl = data.profileUrl;

      return await prisma.team.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::update', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<Team> {
    try {
      return await prisma.team.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::delete', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::delete', appError);
      throw appError;
    }
  }

  async findByDepartment(department: Department): Promise<Team[]> {
    try {
      return await prisma.team.findMany({
        where: { department },
        orderBy: { name: 'asc' }
      });
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::findByDepartment', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find team members by department',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::findByDepartment', appError);
      throw appError;
    }
  }

  async findByNameAndPosition(name: string, position: string): Promise<Team | null> {
    try {
      return await prisma.team.findFirst({
        where: { 
          AND: [
            {
              name: {
                equals: name,
                mode: 'insensitive'
              }
            },
            {
              position: {
                equals: position,
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
        logger.error('TeamRepository::findByNameAndPosition', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to find team member by name and position',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::findByNameAndPosition', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.team.count();
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::count', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count team members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::count', appError);
      throw appError;
    }
  }

  async countByDepartment(): Promise<{ [key in Department]: number }> {
    try {
      const [leadership, engineering, operations] = await Promise.all([
        prisma.team.count({ where: { department: Department.LEADERSHIP } }),
        prisma.team.count({ where: { department: Department.ENGINEERING } }),
        prisma.team.count({ where: { department: Department.OPERATIONS } })
      ]);

      return {
        LEADERSHIP: leadership,
        ENGINEERING: engineering,
        OPERATIONS: operations
      };
    } catch (error: any) {
      // Handle known Prisma errors consistently
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('TeamRepository::countByDepartment', appError);
        throw appError;
      }
      // For other errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count team members by department',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamRepository::countByDepartment', appError);
      throw appError;
    }
  }
}

export default new TeamRepository();