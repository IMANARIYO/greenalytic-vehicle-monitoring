import { Router, Request, Response } from 'express';
import UserController from '../controllers/UserController';

export const UserRouter = Router();

const userController = new UserController();


UserRouter.post('/signup', (req: Request, res: Response) => {
  userController.signup(req, res);
});

UserRouter.post('/login', (req: Request, res: Response) => {
  userController.login(req, res);
});

UserRouter.put('/users/:id', (req: Request, res: Response) => {
  userController.updateUser(req, res);
});

UserRouter.delete('/users/:id/soft', (req: Request, res: Response) => {
  userController.softDeleteUser(req, res);
});

UserRouter.delete('/users/:id/hard', (req: Request, res: Response) => {
  userController.hardDeleteUser(req, res);
});

UserRouter.put('/users/:id/restore', (req: Request, res: Response) => {
  userController.restoreUser(req, res);
});

UserRouter.put('/change-password', (req: Request, res: Response) => {
  userController.changePassword(req, res);
});

UserRouter.post('/request-password-reset', (req: Request, res: Response) => {
  userController.requestPasswordReset(req, res);
});

UserRouter.post('/reset-password', (req: Request, res: Response) => {
  userController.resetPassword(req, res);
});

UserRouter.put('/users/:id/role', (req: Request, res: Response) => {
  userController.changeRole(req, res);
});

UserRouter.post('/users', (req: Request, res: Response) => {
  userController.createUser(req, res);
});

UserRouter.get('/users', (req: Request, res: Response) => {
  userController.listUsers(req, res);
});

