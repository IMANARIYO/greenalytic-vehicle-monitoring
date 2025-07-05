import prisma from '../config/db';
import { Prisma as PrismaTypes, User, UserStatus } from '@prisma/client';

import { UpdateUserDTO, UserListQueryDTO } from '../types/dtos/CreateUserDto';
import { GetUserByIdResponse, InternalUser, UserBasicInfo, UserListItemWithCounts } from '../types';
import { PaginationMeta } from '../types/GrobalTypes';
import logger from '../utils/logger';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';


class UserRepository {
  private tag = '[UserRepository]';

  async addUser(data: PrismaTypes.UserCreateInput): Promise<UserBasicInfo> {
    logger.info(`${this.tag} addUser() called`);
    try {
      const user = await prisma.user.create({ data });
      logger.info(`${this.tag} addUser() succeeded — new user ID: ${user.id}`);
      const safeUser: UserBasicInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        role: user.role,
        status: user.status
      };
      return safeUser;
    } catch (error: unknown) {
      logger.error(`${this.tag} addUser() failed — ${JSON.stringify(error)}`);
  
      // Optional: if you're using a global AppError handler
      if (error instanceof PrismaTypes .PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
  
      throw new AppError('Failed to create user', 500); // generic fallback
    }
  }
  

  async modifyUser(id: number, data: UpdateUserDTO): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} modifyUser() called — id: ${id}`);
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
        },
      });
      logger.info(`${this.tag} modifyUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} modifyUser() failed — id: ${id}, error: ${error}`);
  
      if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
  
      throw new AppError('Failed to update user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async updatePassword(id: number, password: string): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} updatePassword() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { password },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          phoneNumber: true,
          companyName: true,
          role: true,
          status: true,
        },
      });
      logger.info(`${this.tag} updatePassword() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} updatePassword() failed — id: ${id}, error: ${error}`);
  
      if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
  
      throw new AppError('Failed to update password', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async getUserByEmail(email: string): Promise<UserBasicInfo |null> {
    logger.info(`${this.tag} getUserByEmail() called — email: ${email}`);
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        logger.warn(`${this.tag} getUserByEmail() no user found — email: ${email}`);
        if (!user) {
          return null; // <-- no throw
        }
      }
      logger.info(`${this.tag} getUserByEmail() found user — email: ${email}`);
      return user;
    } catch (error: unknown) {
      // Narrow unknown to Error
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserByEmail() failed — email: ${email}, error: ${error.message}`);
  
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        
        if (error instanceof AppError) {
          throw error;
        }
  
        throw new AppError(error.message);
      }
  
      // fallback for unknown error type
      logger.error(`${this.tag} getUserByEmail() failed — email: ${email}, error: unknown`);
      throw new AppError('Failed to get user by email');
    }
  }
  
async modifyUserInternal(id: number, data: PrismaTypes.UserUpdateInput): Promise<UserBasicInfo | null> {
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

    if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
      throw handlePrismaError(error);
    }

    throw new AppError('Failed to update user', HttpStatusCode.INTERNAL_SERVER_ERROR);
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
      if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
        throw handlePrismaError(error);
      }
      throw new AppError('Failed to get user by email', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  async findUsers(query: UserListQueryDTO): Promise<{
    users: UserListItemWithCounts[];
    meta: PaginationMeta;
  }> {
    logger.info(`${this.tag} findUsers() called — ${JSON.stringify(query)}`);
  
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;
  
      const skip = (page - 1) * limit;
  
      const where: PrismaTypes.UserWhereInput = {};
  
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }
  
      if (role) {
        where.role = role;
      }
  
      if (status) {
        where.status = status as UserStatus;
      }
  
      const totalItems = await prisma.user.count({ where });
  
      const users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          gender: true,
          phoneNumber: true,
          location: true,
          companyName: true,
          businessSector: true,
          fleetSize: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          verified: true,
          language: true,
          notificationPreference: true,
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
        },
      });
  
      const totalPages = Math.ceil(totalItems / limit);
      const meta: PaginationMeta = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
  
      logger.info(`${this.tag} findUsers() succeeded — returned ${users.length} users`);
      return { users, meta };
    } 
    
    catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} findUsers() failed — error: ${error.message}`);
    
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
    
        throw new AppError(
          error.message || 'Failed to retrieve user list.',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    
      // If the error is not an instance of Error
      logger.error(`${this.tag} findUsers() failed — unknown error:`, error);
      throw new AppError(
        'Unknown error occurred while retrieving users.',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
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
          role: true,
          status: true,
          phoneNumber: true,
          location: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
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
              deletedAt: true,
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
          reports: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              createdAt: true,
            },
          },
          activityLogs: {
            take: 3,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              action: true,
              timestamp: true,
            },
          },
          userNotifications: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              message: true,
              isRead: true,
            },
          },
        },
      });
  
      if (!user) {
        logger.warn(`${this.tag} getUserById() no user found — id: ${id}`);
        return null; // no user found, return null (no throw)
      }
  
      logger.info(`${this.tag} getUserById() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserById() failed — id: ${id}, error: ${error.message}`);
  
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
  
        if (error instanceof AppError) {
          throw error;
        }
  
        throw new AppError(error.message);
      }
  
      logger.error(`${this.tag} getUserById() failed — id: ${id}, error: unknown`);
      throw new AppError('Failed to get user by id');
    }
  }
  

  async getUserByIdWithPassword(id: number): Promise<InternalUser | null> {
    logger.info(`${this.tag} getUserByIdWithPassword() called — id: ${id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, username: true, email: true, role: true, status: true,
          phoneNumber: true, location: true, companyName: true,
          createdAt: true, updatedAt: true, password: true,
          _count: {
            select: {
              vehicles: true, trackingDevices: true, alerts: true,
              reports: true, activityLogs: true, userNotifications: true
            }
          },
          vehicles: {
            take: 3,
            select: {
              id: true, plateNumber: true, vehicleModel: true,
              status: true, emissionStatus: true, deletedAt: true
            }
          },
          trackingDevices: {
            take: 3,
            select: {
              id: true, serialNumber: true, model: true,
              deviceCategory: true, status: true
            }
          },
          alerts: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, type: true, title: true, isRead: true, createdAt: true
            }
          },
          reports: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, title: true, type: true, status: true, createdAt: true
            }
          },
          activityLogs: {
            take: 3,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true, action: true, timestamp: true
            }
          },
          userNotifications: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, title: true, message: true, isRead: true
            }
          },
        },
      });
  
      logger.info(`${this.tag} getUserByIdWithPassword() ${user ? 'succeeded' : 'no result'} — id: ${id}`);
      return user;
  
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getUserByIdWithPassword() failed — id: ${id}, error: ${error.message}`);
  
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
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
  

  async getAllUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; pagination: PaginationMeta }> {
    logger.info(`${this.tag} getAllUsers() called —`, JSON.stringify(query));
  
    try {
      const result = await this.findUsers(query);
      logger.info(`${this.tag} getAllUsers() succeeded`);
      return { users: result.users, pagination: result.meta };
  
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} getAllUsers() failed — ${error.message}`);
  
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
  
        throw new AppError(
          error.message || 'Failed to fetch users',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
  
      // fallback if `error` is not an instance of `Error`
      logger.error(`${this.tag} getAllUsers() failed — unknown error`, error);
      throw new AppError(
        'Unknown error occurred while fetching all users',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
    
    
  }
  


  
  
  
  async softDeleteUser(id: number): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} softDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      logger.info(`${this.tag} softDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} softDeleteUser() failed — id: ${id}, error: ${error.message}`);
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`${this.tag} softDeleteUser() failed — unknown error`, error);
      throw new AppError('Failed to soft delete user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async hardDeleteUser(id: number): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} hardDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.delete({ where: { id } });
      logger.info(`${this.tag} hardDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} hardDeleteUser() failed — id: ${id}, error: ${error.message}`);
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`${this.tag} hardDeleteUser() failed — unknown error`, error);
      throw new AppError('Failed to hard delete user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async restoreUser(id: number): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} restoreUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      logger.info(`${this.tag} restoreUser() succeeded — id: ${id}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} restoreUser() failed — id: ${id}, error: ${error.message}`);
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`${this.tag} restoreUser() failed — unknown error`, error);
      throw new AppError('Failed to restore user', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async countUsers(): Promise<number> {
    logger.info(`${this.tag} countUsers() called`);
    try {
      const count = await prisma.user.count();
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
  
  async findUsersByEmail(email: string): Promise<UserBasicInfo[]> {
    logger.info(`${this.tag} findUsersByEmail() called — email: ${email}`);
    try {
      const users = await prisma.user.findMany({
        where: { email: { contains: email, mode: 'insensitive' } },
      });
      logger.info(`${this.tag} findUsersByEmail() succeeded — found ${users.length} users`);
      return users;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} findUsersByEmail() failed — email: ${email}, error: ${error.message}`);
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`${this.tag} findUsersByEmail() failed — unknown error`, error);
      throw new AppError('Failed to find users by email', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  async changeUserStatus(id: number, status: UserStatus): Promise<UserBasicInfo | null> {
    logger.info(`${this.tag} changeUserStatus() called — id: ${id}, status: ${status}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          phoneNumber: true,
          companyName: true,
          role: true,
          status: true,
        },
      });
      logger.info(`${this.tag} changeUserStatus() succeeded — id: ${id}, status: ${status}`);
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`${this.tag} changeUserStatus() failed — id: ${id}, error: ${error.message}`);
        if (error instanceof PrismaTypes.PrismaClientKnownRequestError) {
          throw handlePrismaError(error);
        }
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`${this.tag} changeUserStatus() failed — unknown error`, error);
      throw new AppError('Failed to change user status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
}

export default new UserRepository();
