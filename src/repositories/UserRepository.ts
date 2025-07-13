import prisma from '../config/db';
import { Prisma, User, UserStatus, UserRole } from '@prisma/client';

import { PaginationMeta } from '../types/GlobalTypes';
import logger from '../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode } from '../middlewares/errorHandler';
import { CreateUserDTO, GetUserByIdResponse, InternalUser, UpdateUserDTO, UserBasicInfo, UserListItemWithCounts, UserListQueryDTO } from '../types';
import { UpdateUserDto } from '../types/dtos/UpdateUserDto';

class UserRepository {
  private readonly tag = '[UserRepository]';

  // Helper methods for consistent field selection
  private getBasicUserSelect(): Prisma.UserSelect {
    return {
      id: true,
      username: true,
      email: true,
      image: true,
      phoneNumber: true,
      companyName: true,
      role: true,
      status: true,
    };
  }

  private getUserListSelect(): Prisma.UserSelect {
    return {
      ...this.getBasicUserSelect(),
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      _count: {
        select: {
          vehicles: true,
          trackingDevices: true,
          alerts: true,
          reports: true,
          // activityLogs: true,
          userNotifications: true,
        },
      },
    };
  }

  // User CRUD Operations
  async addUser(data: CreateUserDTO): Promise<UserBasicInfo> {
    logger.info(`${this.tag} addUser() called`);
    console.log("data,",data)
    try {
      const user = await prisma.user.create({
        data,
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} addUser() succeeded — new user ID: ${user.id}`);
      return user;
    } catch (error: unknown) {
      console.log(error)
      logger.error(`${this.tag} addUser() failed — ${JSON.stringify(error)}`);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      
      throw new AppError('Failed to create user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async modifyUser(id: number, data: UpdateUserDTO): Promise<UserBasicInfo> {
    logger.info(`${this.tag} modifyUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} modifyUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} modifyUser() failed — id: ${id}, error: ${error}`);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      
      throw new AppError('Failed to update user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(id: number, password: string): Promise<UserBasicInfo> {
    logger.info(`${this.tag} updatePassword() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { password },
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} updatePassword() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} updatePassword() failed — id: ${id}, error: ${error}`);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      
      throw new AppError('Failed to update password', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // User Query Operations
  async getUserByEmail(email: string): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} getUserByEmail() called — email: ${email}`);
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: this.getBasicUserSelect(),
      });
      
      if (!user) {
        logger.warn(`${this.tag} getUserByEmail() no user found — email: ${email}`);
        return null;
      }
      
      logger.info(`${this.tag} getUserByEmail() found user — email: ${email}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserByEmail() failed — email: ${email}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message);
      }
      
      logger.error(`${this.tag} getUserByEmail() failed — email: ${email}, error: unknown`);
      throw new AppError('Failed to get user by email');
    }
  }

  async getUserByEmailWithPassword(email: string): Promise<User | null> {
    logger.info(`${this.tag} getUserByEmailWithPassword() called — email: ${email}`);
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error(`${this.tag} getUserByEmailWithPassword() failed — email: ${email}, error: ${error}`);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      
      throw new AppError('Failed to get user by email', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserById(id: number): Promise<GetUserByIdResponse | null> {
    logger.info(`${this.tag} getUserById() called — id: ${id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          gender:true,
          companyRegistrationNumber:true,
          nationalId:true,
          businessSector:true,
          language:true,
          phoneNumber: true,
          companyName: true,
          notificationPreference:true,
          role: true,
          status: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          fleetSize:true,
        
          _count: {
            select: {
              vehicles: true,
              trackingDevices: true,
              alerts: true,
              reports: true,
              activityLogs: true,
              userNotifications: true,
            },
          },
          vehicles: {
            take: 3,
            select: {
              id: true,
              plateNumber: true,
              vehicleModel: true,
              status: true,
              emissionStatus: true,
            },
          },
          trackingDevices: {
            take: 3,
            select: {
              id: true,
              serialNumber: true,
              model: true,
              deviceCategory: true,
              status: true,
            },
          },
          alerts: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              title: true,
              isRead: true,
              createdAt: true,
            },
          },

        },
      });
      
      if (!user) {
        logger.warn(`${this.tag} getUserById() no user found — id: ${id}`);
        return null;
      }
      
      logger.info(`${this.tag} getUserById() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserById() failed — id: ${id}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message);
      }
      
      logger.error(`${this.tag} getUserById() failed — id: ${id}, error: unknown`);
      throw new AppError('Failed to get user by id');
    }
  }

  // User List Operations
  async listUsers(query: UserListQueryDTO): Promise<{
    data: UserListItemWithCounts[];
    pagination: PaginationMeta;
  }> {
    logger.info(`${this.tag} findUsers() called — ${JSON.stringify(query)}`);
    
    try {
      const {

        search,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeDeleted = false,
        deletedOnly = false,
      } = query;
      const page = parseInt(String(query.page), 10);
const limit = parseInt(String(query.limit), 10);
      
      const skip = (page - 1) * limit;
      

      const where: Prisma.UserWhereInput = {
        // Handle soft delete filtering
        ...(deletedOnly 
          ? { deletedAt: { not: null } }
          : includeDeleted 
            ? {} 
            : { deletedAt: null }
        ),
        // Apply filters
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role }),
        ...(filters.verified !== undefined && { verified: filters.verified }),
        // Apply search
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            {nationalId:{contains:search,mode:`insensitive`}},
            {phoneNumber:{contains:search,mode:`insensitive`}}
            
          ],
        }),
      };
      
      const [data, totalItems] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: this.getUserListSelect(),
        }),
        prisma.user.count({ where }),
      ]);
      
      const totalPages = Math.ceil(totalItems / limit);
      const pagination: PaginationMeta = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : undefined,
        prevPage: page > 1 ? page - 1 : undefined,
        sortBy,
        sortOrder,
      };
      
      logger.info(`${this.tag} findUsers() succeeded — returned ${data.length} users`);
      return { data, pagination };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} findUsers() failed — error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(
          error.message || 'Failed to retrieve user list.',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
      
      logger.error(`${this.tag} findUsers() failed — unknown error:`, error);
      throw new AppError(
        'Unknown error occurred while retrieving users.',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // User Status Management
  async changeUserStatus(id: number, status: UserStatus): Promise<UserBasicInfo> {
    logger.info(`${this.tag} changeUserStatus() called — id: ${id}, status: ${status}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} changeUserStatus() succeeded — id: ${id}, status: ${status}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} changeUserStatus() failed — id: ${id}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      
      logger.error(`${this.tag} changeUserStatus() failed — unknown error`, error);
      throw new AppError('Failed to change user status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // User Deletion/Recovery
  async softDeleteUser(id: number): Promise<UserBasicInfo> {
    logger.info(`${this.tag} softDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} softDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} softDeleteUser() failed — id: ${id}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      
      logger.error(`${this.tag} softDeleteUser() failed — unknown error`, error);
      throw new AppError('Failed to soft delete user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async restoreUser(id: number): Promise<UserBasicInfo> {
    logger.info(`${this.tag} restoreUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} restoreUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} restoreUser() failed — id: ${id}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      
      logger.error(`${this.tag} restoreUser() failed — unknown error`, error);
      throw new AppError('Failed to restore user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hardDeleteUser(id: number): Promise<UserBasicInfo> {
    logger.info(`${this.tag} hardDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.delete({
        where: { id },
        select: this.getBasicUserSelect(),
      });
      logger.info(`${this.tag} hardDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} hardDeleteUser() failed — id: ${id}, error: ${error.message}`);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      
      logger.error(`${this.tag} hardDeleteUser() failed — unknown error`, error);
      throw new AppError('Failed to hard delete user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // Utility Methods
  async countUsers(includeDeleted = false): Promise<number> {
    logger.info(`${this.tag} countUsers() called`);
    try {
      const count = await prisma.user.count({
        where: includeDeleted ? undefined : { deletedAt: null },
      });
      logger.info(`${this.tag} countUsers() succeeded — count: ${count}`);
      return count;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} countUsers() failed — ${error.message}`);
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      
      logger.error(`${this.tag} countUsers() failed — unknown error`, error);
      throw new AppError('Failed to count users', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  
  async getUserByIdWithPassword(id: number): Promise<InternalUser | null> {
    logger.info(`${this.tag} getUserByIdWithPassword() called — id: ${id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          image:true,
          username: true,
          email: true,
          role: true,
          status: true,
          phoneNumber: true,
          companyName:true,
          password: true,  
        },
      });
  
      logger.info(`${this.tag} getUserByIdWithPassword() ${user ? 'succeeded' : 'no result'} — id: ${id}`);
      return user;
  
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserByIdWithPassword() failed — id: ${id}, error: ${error.message}`);
  
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
  
        throw new AppError(
          error.message || 'Failed to get user by ID with password.',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
  
      // fallback for unknown error types
      logger.error(`${this.tag} getUserByIdWithPassword() failed — id: ${id}, unknown error:`, error);
      throw new AppError(
        'Unknown error occurred while fetching user by ID with password.',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
    
async modifyUserInternal(id: number, data: Prisma.UserUpdateInput): Promise<UserBasicInfo | null> {
  logger.info(`${this.tag} modifyUserInternal() called — id: ${id}`);
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        phoneNumber: true,
        companyName: true,
        role: true,
        status: true,
        // include other fields if needed
      },
    });
    logger.info(`${this.tag} modifyUserInternal() succeeded — id: ${id}`);
    return user;
  } catch (error) {
    logger.error(`${this.tag} modifyUserInternal() failed — id: ${id}, error: ${error}`);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw handlePrismaError(error);
    }

    throw new AppError('Failed to update user', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}
  
}

export default new UserRepository();