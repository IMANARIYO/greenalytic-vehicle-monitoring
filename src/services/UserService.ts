import { Request, Response as ExpressResponse } from 'express';
import { Prisma as PrismaTypes } from '@prisma/client';
import UserRepo from '../repositories/UserRepository';
import Response from '../utils/response';
import { generateOTP, isOTPValid, passComparer, passHashing } from '../utils/passwordFunctions';
import { AuthenticatedRequest, tokengenerating } from '../utils/jwtFunctions';




class UserService {
  // Signup
  async signup(req: Request, res: ExpressResponse) {
    try {
      const { email, password, ...rest } = req.body;
      const existingUser = await UserRepo.getUserByEmail(email);
      if (existingUser) {
        return Response.conflict(res, 'User already exists');
      }

      const hashedPassword = await passHashing(password);
      const user = await UserRepo.addUser({ email, password: hashedPassword, ...rest });
      return Response.created(res, user, 'Signup successful');
    } catch (error) {
      return Response.error(res, error, 'Signup failed');
    }
  }

  // Login
  async login(req: Request, res: ExpressResponse) {
    try {
      const { email, password } = req.body;
      const user = await UserRepo.getUserByEmail(email);
      if (!user || !(await passComparer(password, user.password))) {
        return Response.unauthorized(res, 'Invalid email or password');
      }

      const token = tokengenerating({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username || '',
      });

      return Response.success(res, { user, token }, 'Login successful');
    } catch (error) {
      return Response.error(res, error, 'Login failed');
    }
  }

  // Change Password (Authenticated)
  async changePassword(req: AuthenticatedRequest, res: ExpressResponse) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.userId!;
      const user = await UserRepo.getUserById(userId);

      if (!user || !(await passComparer(oldPassword, user.password))) {
        return Response.badRequest(res, 'Old password is incorrect');
      }

      const hashedPassword = await passHashing(newPassword);
      const updatedUser = await UserRepo.modifyUser(userId, { password: hashedPassword });

      return Response.success(res, updatedUser, 'Password updated successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to change password');
    }
  }

  // Forgot Password - Generate OTP
  async requestPasswordReset(req: Request, res: ExpressResponse) {
    try {
      const { email } = req.body;
      const user = await UserRepo.getUserByEmail(email);
      if (!user) return Response.notFound(res, 'User not found');

      const { code, expiresAt } = generateOTP();
      await UserRepo.modifyUser(user.id, { otp: code, otpExpiresAt: expiresAt });

      return Response.success(res, { otp: code }, 'OTP sent (displayed here for now)');
    } catch (error) {
      return Response.error(res, error, 'Failed to generate OTP');
    }
  }

  // Reset Password using OTP
  async resetPassword(req: Request, res: ExpressResponse) {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await UserRepo.getUserByEmail(email);
      if (!user || !user.otp || !user.otpExpiresAt) {
        return Response.badRequest(res, 'OTP not found or expired');
      }

      const validation = isOTPValid(user.otp, otp, user.otpExpiresAt);
      if (!validation.valid) {
        return Response.badRequest(res, validation.message);
      }

      const hashedPassword = await passHashing(newPassword);
      const updatedUser = await UserRepo.modifyUser(user.id, {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      });

      return Response.success(res, updatedUser, 'Password reset successful');
    } catch (error) {
      return Response.error(res, error, 'Failed to reset password');
    }
  }

  // Change Role
  async changeRole(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;

      const updatedUser = await UserRepo.modifyUser(userId, { role });
      return Response.success(res, updatedUser, 'User role updated successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to change role');
    }
  }

  // Create User (for admin bulk or manual creation)
  async createUser(req: Request, res: ExpressResponse) {
    try {
      const newUserData = req.body;

      // Hash the password before saving
      if (!newUserData.password) {
        return Response.badRequest(res, 'Password is required');
      }

      const hashedPassword = await passHashing(newUserData.password);

      const user = await UserRepo.addUser({
        ...newUserData,
        password: hashedPassword,
      });

      return Response.created(res, user, 'User created successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to create user');
    }
  }
  // Update User
  async updateUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const updatedData: PrismaTypes.UserUpdateInput = req.body;

      const updatedUser = await UserRepo.modifyUser(userId, updatedData);
      if (!updatedUser) {
        return Response.notFound(res, 'User not found');
      }

      return Response.success(res, updatedUser, 'User updated successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to update user');
    }
  }
  
  // Soft Delete User
async softDeleteUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserRepo.softDeleteUser(userId);
      if (!user) return Response.notFound(res, 'User not found');
      return Response.success(res, user, 'User soft deleted');
    } catch (error) {
      return Response.error(res, error, 'Failed to soft delete user');
    }
  }
  
  // Hard Delete User
  async hardDeleteUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserRepo.hardDeleteUser(userId);
      if (!user) return Response.notFound(res, 'User not found');
      return Response.success(res, user, 'User permanently deleted');
    } catch (error) {
      return Response.error(res, error, 'Failed to hard delete user');
    }
  }
  
  // Restore User
  async restoreUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserRepo.restoreUser(userId);
      if (!user) return Response.notFound(res, 'User not found');
      return Response.success(res, user, 'User restored successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to restore user');
    }
  }
  
}

export default new UserService();
