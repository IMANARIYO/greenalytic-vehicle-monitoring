import { Request, Response as ExpressResponse } from "express";
import UserService from "../services/UserService.js";
import Response from "../utils/response.js";
import { tokengenerating } from "../utils/jwtFunctions.js";
import { PaginationParams } from "../types/GlobalTypes.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

class UserController {
  constructor() {
    Object.getOwnPropertyNames(UserController.prototype).forEach((method) => {
      if (method !== "constructor") {
        (this as any)[method] = (this as any)[method].bind(this);
      }
    });
  }

  async signup(req: Request, res: ExpressResponse) {
    try {
      const user = await UserService.signup(req.body);
      return Response.created(res, user, "User registered successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async login(req: Request, res: ExpressResponse) {
    try {
      const { user, token } = await UserService.login(req.body);
      return Response.success(res, { user, token }, "Login successful");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async googleAuth(req: Request, res: ExpressResponse) {
    try {
      const user = req.user as any;
      if (!user) return res.redirect("http://localhost:3000/login");

      const token = tokengenerating({
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username || "",
      });

      return res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    } catch {
      return res.redirect("http://localhost:3000/login");
    }
  }

  async getUserById(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const user = await UserService.getUserById(userId);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User retrieved successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async updateUser(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const user = await UserService.updateUser(userId, req.body);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User updated successfully");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async changeUserStatus(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!status) return Response.badRequest(res, "Status is required");

    try {
      const user = await UserService.changeUserStatus(userId, status);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User status updated");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async softDeleteUser(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const user = await UserService.softDeleteUser(userId);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User soft deleted");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async hardDeleteUser(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const user = await UserService.hardDeleteUser(userId);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User permanently deleted");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async restoreUser(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const user = await UserService.restoreUser(userId);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User restored");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async changePassword(req: Request, res: ExpressResponse) {
    const userId = req.userId;
    if (!userId) return Response.unauthorized(res, "Unauthorized");

    try {
      const user = await UserService.changePassword(userId, req.body);
      return Response.success(res, user, "Password changed");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async requestPasswordReset(req: Request, res: ExpressResponse) {
    try {
      const { email } = req.body;
      await UserService.requestPasswordReset(email);
      return Response.success(res, null, "OTP sent to email");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async resetPassword(req: Request, res: ExpressResponse) {
    try {
      const user = await UserService.resetPassword(req.body);
      return Response.success(res, user, "Password reset successful");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async changeRole(req: Request, res: ExpressResponse) {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return Response.badRequest(res, "Invalid user ID");

    try {
      const { role } = req.body;
      const user = await UserService.changeRole(userId, role);
      if (!user) return Response.notFound(res, "User");
      return Response.success(res, user, "User role changed");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async createUser(req: Request, res: ExpressResponse) {
    try {
      const user = await UserService.createUser(req.body);
      return Response.created(res, user, "User created");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }

  async listUsers(req: Request, res: ExpressResponse) {
    try {
      const query = req.query as unknown as PaginationParams;
      const result = await UserService.listUsers(query);
      return Response.success(res, result, "Users retrieved");
    } catch (error: any) {
      return Response.badRequest(res, error.message);
    }
  }
}

export default UserController;
