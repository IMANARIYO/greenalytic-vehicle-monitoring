import prisma from '../config/db';
import { Prisma as PrismaTypes, User } from '@prisma/client';

class UserRepository {
  async addUser(data: PrismaTypes.UserCreateInput): Promise<User> {
    return await prisma.user.create({ data });
  }

  async modifyUser(id: number, data: PrismaTypes.UserUpdateInput): Promise<User | null> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  async getUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  async getAllUsers(): Promise<User[]> {
    return await prisma.user.findMany();
  }

  async softDeleteUser(id: number): Promise<User | null> {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async hardDeleteUser(id: number): Promise<User | null> {
    return await prisma.user.delete({
      where: { id },
    });
  }
  async restoreUser(id: number): Promise<User | null> {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
  async countUsers(): Promise<number> {
    return await prisma.user.count();
  }
  async findUsersByName(name: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        username: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
  } 
  async findUsersByEmail(email: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
    });
  }
}

export default new UserRepository();
