import prisma from '../config/db';
import { Prisma as PrismaTypes, User, UserStatus } from '@prisma/client';
import { PaginationMeta, UserListQueryDTO } from '../types/dtos/CreateUserDto';
import { GetUserByIdResponse, InternalUser, UserListItemWithCounts } from '../types';

class UserRepository {
  async addUser(data: PrismaTypes.UserCreateInput): Promise<User> {
    try {
      return await prisma.user.create({ data });
    } catch (error) {
      throw error;
    }
  }

  async modifyUser(id: number, data: PrismaTypes.UserUpdateInput): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      throw error;
    }
  }
  
  async findUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; meta: PaginationMeta }> {
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
      const take = limit;

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
        take,
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

      return {users, meta };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: number): Promise<GetUserByIdResponse | null> {
    try {
      return await prisma.user.findUnique({
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
    } catch (error) {
      throw error;
    }
  }
  
  
  async getUserByIdWithPassword(id: number): Promise<InternalUser | null> {
    try {
      return await prisma.user.findUnique({
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
          password: true, 
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
    } catch (error) {
      throw error;
    }
  }
  async getAllUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; pagination: PaginationMeta }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        status,
        sortBy = 'id',
        sortOrder = 'asc',
      } = query;
    
      const skip = (page - 1) * limit;
    
      const where: PrismaTypes.UserWhereInput = {
        AND: [
          { deletedAt: null },
          ...(search ? [{
            OR: [
              { username: { contains: search, mode: PrismaTypes.QueryMode.insensitive } },
              { email: { contains: search, mode: PrismaTypes.QueryMode.insensitive } },
            ],
          }] : []),
          ...(role ? [{ role }] : []),
          ...(status ? [{ status: status as UserStatus }] : []),
        ],
      };
    
      const totalItems = await prisma.user.count({ where });
    
      const users = await prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
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
    
      const pagination: PaginationMeta = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    
      return { users, pagination };
    } catch (error) {
      throw error;
    }
  }

  async softDeleteUser(id: number): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw error;
    }
  }

  async hardDeleteUser(id: number): Promise<User | null> {
    try {
      return await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async restoreUser(id: number): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error) {
      throw error;
    }
  }

  async countUsers(): Promise<number> {
    try {
      return await prisma.user.count();
    } catch (error) {
      throw error;
    }
  }


  async findUsersByEmail(email: string): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: {
          email: {
            contains: email,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new UserRepository();
