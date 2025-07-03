import prisma from '../config/db';
import { Prisma as PrismaTypes, User, UserStatus } from '@prisma/client';
import { PaginationMeta, UserListQueryDTO } from '../types/dtos/CreateUserDto';

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
  
  async findUsers(query: UserListQueryDTO): Promise<{ data: User[]; meta: PaginationMeta }> {
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

      const data = await prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
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

      return { data, meta };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(query: UserListQueryDTO): Promise<{ users: User[]; pagination: PaginationMeta }> {
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

  async findUsersByName(name: string): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: {
          username: {
            contains: name,
            mode: 'insensitive',
          },
        },
      });
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
