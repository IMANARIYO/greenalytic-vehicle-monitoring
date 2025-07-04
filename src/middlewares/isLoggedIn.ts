
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions';
export const isLoggedIn = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  verifyingtoken(req, res, next);
};
