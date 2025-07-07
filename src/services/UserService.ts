import { Prisma as PrismaTypes, User, UserRole, UserStatus } from '@prisma/client';
import UserRepo from '../repositories/UserRepository';
import { generateOTP, isOTPValid, passComparer, passHashing } from '../utils/passwordFunctions';


import { tokengenerating } from '../utils/jwtFunctions';
import { ChangePasswordDTO, CreateUserDTO, GetUserByIdResponse, LoginDTO, ResetPasswordDTO, SignupDTO, UpdateUserDTO, UserBasicInfo, UserListItemWithCounts, UserListQueryDTO } from '../types';

import logger from '../utils/logger';
import { AppError, HttpStatusCode, NotFoundError } from '../middlewares/errorHandler';
import { sendEmail } from '../emailUtils';
import { PaginationMeta } from '../types/GlobalTypes';

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
  async signup(data: SignupDTO): Promise<UserBasicInfo> {
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

  async login(data: LoginDTO): Promise<{ user: UserBasicInfo; token: string }> {
    try {
      const user = await UserRepo.getUserByEmailWithPassword(data.email);
      if (!user || !(await passComparer(data.password, user.password))) {
        throw new Error('Invalid email or password');
      }

      const token = tokengenerating({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username || '',
      });
      const safeUser: UserBasicInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName
      };
      return {  user: safeUser , token };
    } catch (error) {
      throw error;
    }
  }


  async listUsers(query: UserListQueryDTO): Promise<{ users: UserListItemWithCounts[]; pagination: PaginationMeta }> {
    try {
      return await  UserRepo.listUsers(query);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId: number, data: ChangePasswordDTO): Promise<UserBasicInfo | null> {
    try {
      const user = await UserRepo.getUserByIdWithPassword(userId);
      if (!user || !(await passComparer(data.oldPassword, user.password))) {
        throw new Error('Old password is incorrect');
      }
  
      const hashedPassword = await passHashing(data.newPassword);
      return await UserRepo.updatePassword(userId, hashedPassword);
    } catch (error) {
      throw error;
    }
  }
  async changeUserStatus(userId: number, status: UserStatus): Promise<UserBasicInfo | null> {
    try {
      return await UserRepo.changeUserStatus(userId, status);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Log and rethrow as AppError
        logger.error(`[UserService] changeUserStatus() failed — id: ${userId}, error: ${error.message}`);
        throw new AppError(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      logger.error(`[UserService] changeUserStatus() failed — unknown error for id: ${userId}`, error);
      throw new AppError('Unknown error occurred while changing user status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  async getUserById(id: number): Promise<GetUserByIdResponse | null> {
    try {
      const user = await UserRepo.getUserById(id);
      if (!user) {
        throw new NotFoundError(`User with id ${id} `);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  async requestPasswordReset(email: string): Promise<void > {
    try {
      const user = await UserRepo.getUserByEmailWithPassword(email);
      if (!user) throw new NotFoundError('User ');

      const { code, expiresAt } = generateOTP();
      await UserRepo.modifyUserInternal(user.id, { otp: code, otpExpiresAt: expiresAt });
      const subject = 'GREENALYTIC MOTORS - Password Reset OTP';

      const textContent = `
      You requested to reset your password on Greenalytic.
      
      Your OTP code is: ${code}
      It will expire in 10 minutes.
      
      If you did not request this, please ignore this email.
      `;
      
      const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #2E8B57;">GREENALYTIC MOTORS</h2>
        <p>You requested to reset your password.</p>
        <p>Your OTP code is:</p>
        <h3 style="color: #d9534f;">${code}</h3>
        <p>This code will expired at<strong>${expiresAt}</strong>.</p>
        <hr />
        <p style="font-size: 0.9em; color: #888;">
          If you did not request a password reset, please ignore this email or contact Greenalytic support.
        </p>
      </div>
      `;
      
      await sendEmail(user.email, subject, textContent, htmlContent);

    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Failed to request password reset');
    }
  }

  async resetPassword(data: ResetPasswordDTO): Promise<UserBasicInfo | null> {
    try {
      const user = await UserRepo.getUserByEmailWithPassword(data.email);
      if (!user || !user.otp || !user.otpExpiresAt) throw new Error('OTP not found or expired');

      const validation = isOTPValid(user.otp, data.otp, user.otpExpiresAt);
      if (!validation.valid) throw new Error(validation.message);

      const hashedPassword = await passHashing(data.newPassword);
      return await UserRepo.modifyUserInternal(user.id, {

        otp: null,
        otpExpiresAt: null,
      });
    } catch (error) {
      throw error;
    }
  }

  async changeRole(userId: number, role: string): Promise<UserBasicInfo | null> {
    try {
      return await UserRepo.modifyUserInternal(userId, { role: role as UserRole });
    } catch (error) {
      throw error;
    }
  }

  async createUser(data: CreateUserDTO): Promise<UserBasicInfo> {
    try {
      if (!data.password) throw new Error('Password is required');

      const hashedPassword = await passHashing(data.password);
      const cleanData = removeNulls({ ...data, password: hashedPassword });
      return await UserRepo.addUser(cleanData as PrismaTypes.UserCreateInput);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId: number, data: UpdateUserDTO): Promise<UserBasicInfo| null> {
    try {
      return await UserRepo.modifyUser(userId, data);
    } catch (error) {
      throw error;
    }
  }

  async softDeleteUser(userId: number): Promise<UserBasicInfo | null> {
    try {
      return await UserRepo.softDeleteUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async hardDeleteUser(userId: number): Promise<UserBasicInfo | null> {
    try {
      return await UserRepo.hardDeleteUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async restoreUser(userId: number): Promise<UserBasicInfo | null> {
    try {
      return await UserRepo.restoreUser(userId);
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
