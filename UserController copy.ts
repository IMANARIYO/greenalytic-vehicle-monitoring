import {
  Controller,
  Route,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Request,
  Response as TsoaResponse,
  SuccessResponse,
  Security,
} from 'tsoa';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import UserService from './src/services/UserService';
import { SignupDTO } from './src/types/dtos/CreateUserDto';

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

@Route('users')
export class UserController extends Controller {
  private userService = UserService;

  @Post('signup')
  @SuccessResponse('201', 'Created')
  public async signup(@Body() body: SignupDTO) {
    return await UserService.signup(body);
  }

  @Post('login')
  public async login(@Request() req: ExpressRequest, res: ExpressResponse) {
    return this.userService.login(req.body);
  }

  @Patch('{id}')
  @SuccessResponse('200', 'User updated')
  public async updateUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.updateUser(id, req.body);
  }

  @Delete('soft-delete/{id}')
  @SuccessResponse('200', 'User soft deleted')
  public async softDeleteUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.softDeleteUser(req.body);
  }

  @Delete('hard-delete/{id}')
  @SuccessResponse('200', 'User permanently deleted')
  public async hardDeleteUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.hardDeleteUser(req.body);
  }

  @Post('restore/{id}')
  @SuccessResponse('200', 'User restored')
  public async restoreUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.restoreUser(req.body);
  }

  @Patch('change-password')
  @Security('jwt')
  @SuccessResponse('200', 'Password changed')
  public async changePassword(
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    if (typeof req.userId !== 'number') {
      this.setStatus(400);
      return { message: 'User ID is missing or invalid.' };
    }
    return this.userService.changePassword(req.userId, req.body);
  }

  @Post('request-password-reset')
  @SuccessResponse('200', 'OTP sent')
  public async requestPasswordReset(
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    return this.userService.requestPasswordReset(req.body.email);
  }

  @Post('reset-password')
  @SuccessResponse('200', 'Password reset')
  public async resetPassword(
    @Request() req: ExpressRequest,
res: ExpressResponse
  ) {
    return this.userService.resetPassword(req.body);
  }

  @Patch('change-role/{id}')
  @SuccessResponse('200', 'User role changed')
  public async changeRole(
    @Path() id: number,
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.changeRole(id, req.body.role);
  }

  @Post()
  @SuccessResponse('201', 'User created')
  public async createUser(
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    return this.userService.createUser(req.body);
  }
}
