import { Prisma as PrismaTypes, User, UserRole } from '@prisma/client';
import UserRepo from '../repositories/UserRepository';
import { generateOTP, isOTPValid, passComparer, passHashing } from '../utils/passwordFunctions';

import {
  SignupDTO,
  LoginDTO,
  ChangePasswordDTO,
  ResetPasswordDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserListQueryDTO,

} from '../types/dtos/CreateUserDto';
import { tokengenerating } from '../utils/jwtFunctions';
import { UserListItemWithCounts } from '../types';
import { PaginationMeta } from '../types/GrobalTypes';
import logger from '../utils/logger';

function removeNulls<T extends object>(obj: T): T {
  const cleanedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      cleanedObj[key] = undefined;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      cleanedObj[key] = removeNulls(value);
    } else {
      cleanedObj[key] = value;
    }
  }
  return cleanedObj;
}

class UserService {
  async signup(data: SignupDTO): Promise<User> {
    try {
      const existingUser = await UserRepo.getUserByEmail(data.email);
      if (existingUser) throw new Error('User already exists');

      const hashedPassword = await passHashing(data.password);
      const cleanData = removeNulls({ ...data, password: hashedPassword });
      return await UserRepo.addUser(cleanData as PrismaTypes.UserCreateInput);
    } catch (error) {

      throw error;
    }
  }

  async login(data: LoginDTO): Promise<{ user: User; token: string }> {
    try {
      const user = await UserRepo.getUserByEmail(data.email);
      if (!user || !(await passComparer(data.password, user.password))) {
        throw new Error('Invalid email or password');
      }

      const token = tokengenerating({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username || '',
      });

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async listUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; pagination: PaginationMeta }> {
    try {
      return await UserRepo.getAllUsers(query);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId: number, data: ChangePasswordDTO): Promise<User | null> {
    try {
      const user = await UserRepo.getUserByIdWithPassword(userId);
      if (!user || !(await passComparer(data.oldPassword, user.password))) {
        throw new Error('Old password is incorrect');
      }
      const hashedPassword = await passHashing(data.newPassword);
      return await UserRepo.modifyUser(userId, { password: hashedPassword });
    } catch (error) {
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<{ otp: string }> {
    try {
      const user = await UserRepo.getUserByEmail(email);
      if (!user) throw new Error('User not found');

      const { code, expiresAt } = generateOTP();
      await UserRepo.modifyUser(user.id, { otp: code, otpExpiresAt: expiresAt });

      return { otp: code };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordDTO): Promise<User | null> {
    try {
      const user = await UserRepo.getUserByEmail(data.email);
      if (!user || !user.otp || !user.otpExpiresAt) throw new Error('OTP not found or expired');

      const validation = isOTPValid(user.otp, data.otp, user.otpExpiresAt);
      if (!validation.valid) throw new Error(validation.message);

      const hashedPassword = await passHashing(data.newPassword);
      return await UserRepo.modifyUser(user.id, {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      });
    } catch (error) {
      throw error;
    }
  }

  async changeRole(userId: number, role: string): Promise<User | null> {
    try {
      return await UserRepo.modifyUser(userId, { role: role as UserRole });
    } catch (error) {
      throw error;
    }
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    try {
      if (!data.password) throw new Error('Password is required');

      const hashedPassword = await passHashing(data.password);
      const cleanData = removeNulls({ ...data, password: hashedPassword });
      return await UserRepo.addUser(cleanData as PrismaTypes.UserCreateInput);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId: number, data: UpdateUserDTO): Promise<User | null> {
    try {
      return await UserRepo.modifyUser(userId, data);
    } catch (error) {
      throw error;
    }
  }

  async softDeleteUser(userId: number): Promise<User | null> {
    try {
      return await UserRepo.softDeleteUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async hardDeleteUser(userId: number): Promise<User | null> {
    try {
      return await UserRepo.hardDeleteUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async restoreUser(userId: number): Promise<User | null> {
    try {
      return await UserRepo.restoreUser(userId);
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
