import { Response, NextFunction } from 'express';
import ResponseUtil from '../utils/response.js';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions.js';
import { catchAsync } from './errorHandler.js';


export const hasRole = (roles: string[]) => {
  return catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    await new Promise<void>((resolve, reject) => {
      verifyingtoken(req, res, (err?: any) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Then check role
    const userRole = req.userRole;
    if (!userRole || !roles.includes(userRole)) {
      return ResponseUtil.unauthorized(res, 'Access denied: insufficient role');
    }

    next();
  });
};
