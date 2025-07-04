import prisma from '../config/db';
import { Prisma as PrismaTypes, User, UserStatus } from '@prisma/client';
import { UserListQueryDTO } from '../types/dtos/CreateUserDto';
import { GetUserByIdResponse, InternalUser, UserListItemWithCounts } from '../types';
import { PaginationMeta } from '../types/GrobalTypes';
import logger from '../utils/logger';

class UserRepository {
  private tag = '[UserRepository]';

  async addUser(data: PrismaTypes.UserCreateInput): Promise<User> {
    logger.info(`${this.tag} addUser() called`);
    try {
      const user = await prisma.user.create({ data });
      logger.info(`${this.tag} addUser() succeeded — new user ID: ${user.id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} addUser() failed — ${error}`);
      throw error;
    }
  }

  async modifyUser(id: number, data: PrismaTypes.UserUpdateInput): Promise<User | null> {
    logger.info(`${this.tag} modifyUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({ where: { id }, data });
      logger.info(`${this.tag} modifyUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} modifyUser() failed — id: ${id}, error: ${error}`);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    logger.info(`${this.tag} getUserByEmail() called — email: ${email}`);
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      logger.info(`${this.tag} getUserByEmail() ${user ? 'found' : 'not found'} — email: ${email}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} getUserByEmail() failed — email: ${email}, error: ${error}`);
      throw error;
    }
  }

  async findUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; meta: PaginationMeta }> {
    logger.info(`${this.tag} findUsers() called —`, JSON.stringify(query));
    try {
      const { page = 1, limit = 10, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const skip = (page - 1) * limit;

      const where: PrismaTypes.UserWhereInput = {};
      if (search) where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
      if (role) where.role = role;
      if (status) where.status = status as UserStatus;

      const totalItems = await prisma.user.count({ where });
      const users = await prisma.user.findMany({
        where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, username: true, email: true, image: true, gender: true,
          phoneNumber: true, location: true, companyName: true, businessSector: true,
          fleetSize: true, role: true, status: true, createdAt: true, updatedAt: true,
          verified: true, language: true, notificationPreference: true,
          _count: { select: {
            vehicles: true, trackingDevices: true, alerts: true,
            reports: true, activityLogs: true, userNotifications: true
          }}
        },
      });

      const totalPages = Math.ceil(totalItems / limit);
      const meta: PaginationMeta = { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };

      logger.info(`${this.tag} findUsers() succeeded — returned ${users.length} users`);
      return { users, meta };
    } catch (error) {
      logger.error(`${this.tag} findUsers() failed — ${error}`);
      throw error;
    }
  }

  async getUserById(id: number): Promise<GetUserByIdResponse | null> {
    logger.info(`${this.tag} getUserById() called — id: ${id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, username: true, email: true, role: true, status: true,
          phoneNumber: true, location: true, companyName: true,
          createdAt: true, updatedAt: true,
          _count: {
            select: {
              vehicles: true, trackingDevices: true, alerts: true,
              reports: true, activityLogs: true, userNotifications: true
            }
          },
          vehicles: { take: 3, select: {
            id: true, plateNumber: true, vehicleModel: true,
            status: true, emissionStatus: true, deletedAt: true
          }},
          trackingDevices: { take: 3, select: {
            id: true, serialNumber: true, model: true,
            deviceCategory: true, status: true
          }},
          alerts: { take: 3, orderBy: { createdAt: 'desc' }, select: {
            id: true, type: true, title: true, isRead: true, createdAt: true
          }},
          reports: { take: 2, orderBy: { createdAt: 'desc' }, select: {
            id: true, title: true, type: true, status: true, createdAt: true
          }},
          activityLogs: { take: 3, orderBy: { timestamp: 'desc' }, select: {
            id: true, action: true, timestamp: true
          }},
          userNotifications: { take: 3, orderBy: { createdAt: 'desc' }, select: {
            id: true, title: true, message: true, isRead: true
          }},
        },
      });
      logger.info(`${this.tag} getUserById() ${user ? 'succeeded' : 'no result'} — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} getUserById() failed — id: ${id}, error: ${error}`);
      throw error;
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
          vehicles: { take: 3, select: {
            id: true, plateNumber: true, vehicleModel: true,
            status: true, emissionStatus: true, deletedAt: true
          }},
          trackingDevices: { take: 3, select: {
            id: true, serialNumber: true, model: true,
            deviceCategory: true, status: true
          }},
          alerts: { take: 3, orderBy: { createdAt: 'desc' }, select: {
            id: true, type: true, title: true, isRead: true, createdAt: true
          }},
          reports: { take: 2, orderBy: { createdAt: 'desc' }, select: {
            id: true, title: true, type: true, status: true, createdAt: true
          }},
          activityLogs: { take: 3, orderBy: { timestamp: 'desc' }, select: {
            id: true, action: true, timestamp: true
          }},
          userNotifications: { take: 3, orderBy: { createdAt: 'desc' }, select: {
            id: true, title: true, message: true, isRead: true
          }},
        },
      });
      logger.info(`${this.tag} getUserByIdWithPassword() ${user ? 'succeeded' : 'no result'} — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} getUserByIdWithPassword() failed — id: ${id}, error: ${error}`);
      throw error;
    }
  }

  async getAllUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; pagination: PaginationMeta }> {
    logger.info(`${this.tag} getAllUsers() called —`, JSON.stringify(query));
    try {
      // (same logic as findUsers with deletedAt filter)
      const result = await this.findUsers(query);
      logger.info(`${this.tag} getAllUsers() succeeded`);
      return { users: result.users, pagination: result.meta };
    } catch (error) {
      logger.error(`${this.tag} getAllUsers() failed — ${error}`);
      throw error;
    }
  }

  async softDeleteUser(id: number): Promise<User | null> {
    logger.info(`${this.tag} softDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      logger.info(`${this.tag} softDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} softDeleteUser() failed — id: ${id}, error: ${error}`);
      throw error;
    }
  }

  async hardDeleteUser(id: number): Promise<User | null> {
    logger.info(`${this.tag} hardDeleteUser() called — id: ${id}`);
    try {
      const user = await prisma.user.delete({ where: { id } });
      logger.info(`${this.tag} hardDeleteUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} hardDeleteUser() failed — id: ${id}, error: ${error}`);
      throw error;
    }
  }

  async restoreUser(id: number): Promise<User | null> {
    logger.info(`${this.tag} restoreUser() called — id: ${id}`);
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      logger.info(`${this.tag} restoreUser() succeeded — id: ${id}`);
      return user;
    } catch (error) {
      logger.error(`${this.tag} restoreUser() failed — id: ${id}, error: ${error}`);
      throw error;
    }
  }

  async countUsers(): Promise<number> {
    logger.info(`${this.tag} countUsers() called`);
    try {
      const count = await prisma.user.count();
      logger.info(`${this.tag} countUsers() succeeded — count: ${count}`);
      return count;
    } catch (error) {
      logger.error(`${this.tag} countUsers() failed — ${error}`);
      throw error;
    }
  }

  async findUsersByEmail(email: string): Promise<User[]> {
    logger.info(`${this.tag} findUsersByEmail() called — email: ${email}`);
    try {
      const users = await prisma.user.findMany({
        where: { email: { contains: email, mode: 'insensitive' } },
      });
      logger.info(`${this.tag} findUsersByEmail() succeeded — found ${users.length} users`);
      return users;
    } catch (error) {
      logger.error(`${this.tag} findUsersByEmail() failed — email: ${email}, error: ${error}`);
      throw error;
    }
  }
}

export default new UserRepository();
