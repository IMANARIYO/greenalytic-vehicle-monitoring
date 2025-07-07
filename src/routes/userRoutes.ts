import { Router, Request, Response } from 'express';
import UserController from '../controllers/UserController';
import { hasRole } from '../middlewares/hasRole';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import { isLoggedIn } from '../middlewares/isLoggedIn';

export const UserRouter = Router();
const userController = new UserController();
UserRouter.post('/signup', (req: Request, res: Response) => {
  userController.signup(req, res);
});
UserRouter.post('/login', (req: Request, res: Response) => {
  userController.login(req, res);
});
UserRouter.post('/request-password-reset', (req: Request, res: Response) => {
  userController.requestPasswordReset(req, res);
});
UserRouter.post('/reset-password', (req: Request, res: Response) => {
  userController.resetPassword(req, res);
});
UserRouter.put(
  '/change-password',
  hasRole(['ADMIN', 'USER', 'TECHNICIAN', 'MANAGER', 'FLEET_MANAGER', 'ANALYST', 'SUPPORT_AGENT']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.changePassword(req, res);
  }
);
UserRouter.put(
  '/users/:id',
  isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    userController.updateUser(req, res);
  }
);
UserRouter.delete(
  '/users/:id/soft',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.softDeleteUser(req, res);
  }
);
UserRouter.delete(
  '/users/:id/hard',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.hardDeleteUser(req, res);
  }
);

UserRouter.put(
  '/users/:id/restore',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.restoreUser(req, res);
  }
);

UserRouter.put(
  '/users/:id/role',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.changeRole(req, res);
  }
);

UserRouter.post(
  '/users',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.createUser(req, res);
  }
);

UserRouter.get(
  '/users',
  hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    userController.listUsers(req, res);
  }
);
