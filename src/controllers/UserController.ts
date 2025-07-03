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
import UserService from '../services/UserService';

@Route('users')
export class UserController extends Controller {
  private userService = UserService;

  @Post('signup')
  @SuccessResponse('201', 'Created')
  public async signup(@Request() req: ExpressRequest, res: ExpressResponse) {
    return this.userService.signup(req, res);
  }

  @Post('login')
  public async login(@Request() req: ExpressRequest, res: ExpressResponse) {
    return this.userService.login(req, res);
  }

  @Patch('{id}')
  @SuccessResponse('200', 'User updated')
  public async updateUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.updateUser(req, res);
  }

  @Delete('soft-delete/{id}')
  @SuccessResponse('200', 'User soft deleted')
  public async softDeleteUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.softDeleteUser(req, res);
  }

  @Delete('hard-delete/{id}')
  @SuccessResponse('200', 'User permanently deleted')
  public async hardDeleteUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.hardDeleteUser(req, res);
  }

  @Post('restore/{id}')
  @SuccessResponse('200', 'User restored')
  public async restoreUser(
    @Path() id: number,
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.restoreUser(req, res);
  }

  @Patch('change-password')
  @Security('jwt')
  @SuccessResponse('200', 'Password changed')
  public async changePassword(
    @Request() req: ExpressRequest,
    res: ExpressResponse
  ) {
    return this.userService.changePassword(req, res);
  }

  @Post('request-password-reset')
  @SuccessResponse('200', 'OTP sent')
  public async requestPasswordReset(
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    return this.userService.requestPasswordReset(req, res);
  }

  @Post('reset-password')
  @SuccessResponse('200', 'Password reset')
  public async resetPassword(
    @Request() req: ExpressRequest,
res: ExpressResponse
  ) {
    return this.userService.resetPassword(req, res);
  }

  @Patch('change-role/{id}')
  @SuccessResponse('200', 'User role changed')
  public async changeRole(
    @Path() id: number,
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    req.params.id = id.toString();
    return this.userService.changeRole(req, res);
  }

  @Post()
  @SuccessResponse('201', 'User created')
  public async createUser(
    @Request() req: ExpressRequest,
     res: ExpressResponse
  ) {
    return this.userService.createUser(req, res);
  }
}
