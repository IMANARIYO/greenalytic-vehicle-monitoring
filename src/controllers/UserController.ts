import { Request, Response as ExpressResponse } from 'express';
import UserService from '../services/UserService';
import Response  from '../utils/response';

import { tokengenerating } from '../utils/jwtFunctions';
import { PaginationParams } from '../types/GlobalTypes';
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
class UserController {
  constructor() {
    // Remove the invalid await call from constructor
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
    this.googleAuth = this.googleAuth.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.softDeleteUser = this.softDeleteUser.bind(this);
    this.hardDeleteUser = this.hardDeleteUser.bind(this);
    this.restoreUser = this.restoreUser.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.changeRole = this.changeRole.bind(this);
    this.createUser = this.createUser.bind(this);
    this.listUsers = this.listUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
  }
  async changeUserStatus(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const { status } = req.body;  // expect status in body
      if (!status) return Response.badRequest(res, 'Status is required');
  
      const updatedUser = await UserService.changeUserStatus(userId, status);
      if (!updatedUser) return Response.notFound(res, 'User');
  
      return Response.success(res, updatedUser, 'User status updated successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Change user status failed');
    }
  }
  
  // Convert signup to instance method for consistency
  async signup(req: Request, res: ExpressResponse) {
    try {
      // Add missing await keyword
      const user = await UserService.signup(req.body);
      return Response.created(res, user, "User registered successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Signup failed");
    }
  }
  async getUserById(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.getUserById(userId);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User retrieved successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || 'Get user failed');
    }
  }
  
  async login(req: Request, res: ExpressResponse) {
    try {
      const { user, token } = await UserService.login(req.body);
      return Response.success(res, { user, token }, "Login successful");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Login failed");
    }
  }

  async googleAuth(req: Request, res: ExpressResponse) {
    try {
      const user = req.user as any;
      if (!user) return res.redirect("/login");

      const token = tokengenerating({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username || "",
      });

      return res.redirect(`/dashboard?token=${token}`);
    } catch (error: any) {
      return res.redirect("/login");
    }
  }

  async updateUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.updateUser(userId, req.body);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User updated successfully');
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Update failed");
    }
  }

  async softDeleteUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.softDeleteUser(userId);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User soft deleted');
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Soft delete failed");
    }
  }

  async hardDeleteUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.hardDeleteUser(userId);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User permanently deleted');
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Hard delete failed");
    }
  }

  async restoreUser(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.restoreUser(userId);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User restored');
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Restore failed");
    }
  }

  async changePassword(req: Request, res: ExpressResponse) {
    try {
      // assuming user id is in req.user (after auth middleware)
      const userId = req.userId;
      if (!userId) return Response.unauthorized(res, "Unauthorized");

      const user = await UserService.changePassword(userId, req.body);
      if (!user) return Response.badRequest(res, "Password change failed");
      return Response.success(res, user, "Password changed successfully");
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Change password failed"
      );
    }
  }

  async requestPasswordReset(req: Request, res: ExpressResponse) {
    try {
      const { email } = req.body;
      await UserService.requestPasswordReset(email);
      return Response.success(res, null, 'OTP sent to registered email');
      
    } catch (error: any) {
      return Response.badRequest(
        res,
        error.message || "Request password reset failed"
      );
    }
  }

  async resetPassword(req: Request, res: ExpressResponse) {
    try {
      const user = await UserService.resetPassword(req.body);
      if (!user) return Response.badRequest(res, "Password reset failed");
      return Response.success(res, user, "Password reset successful");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Reset password failed");
    }
  }

  async changeRole(req: Request, res: ExpressResponse) {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;
      const user = await UserService.changeRole(userId, role);
      if (!user) return Response.notFound(res, 'User');
      return Response.success(res, user, 'User role changed');
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Change role failed");
    }
  }

  async createUser(req: Request, res: ExpressResponse) {
    try {
      const user = await UserService.createUser(req.body);
      return Response.created(res, user, "User created successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "Create user failed");
    }
  }

  async listUsers(req: Request, res: ExpressResponse) {
    try {
      const query = req.query as unknown as PaginationParams;
      const result = await UserService.listUsers(query);
      return Response.success(res, result, "Users retrieved successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message || "List users failed");
    }
  }
}

export default UserController;