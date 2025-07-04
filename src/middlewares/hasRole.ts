
import { Response, NextFunction } from 'express';

import ResponseUtil from '../utils/response';
import { AuthenticatedRequest, verifyingtoken } from '../utils/jwtFunctions';

export const hasRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    verifyingtoken(req, res, () => {
      const userRole = req.userRole;
      if (!userRole || !roles.includes(userRole)) {
        return ResponseUtil.unauthorized(res, 'Access denied: insufficient role');
      }
      next();
    });
  };
};
