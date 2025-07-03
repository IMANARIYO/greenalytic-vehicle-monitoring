import jwt from 'jsonwebtoken';
import { Request, Response as ExpressResponse, NextFunction } from 'express';
import { ENV } from '../config/env';
import { JwtPayload } from '../types/jwtPayload';
import Response from './response';


export interface AuthenticatedRequest extends Request {
  userId?: number;
  userEmail?: string;
  username?: string;
  userRole?: string;
}

if (!ENV.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const tokengenerating = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET as string, {
    expiresIn: ENV.JWT_EXP || '24h',
  });
};

export const verifyingtoken = (
  req: AuthenticatedRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const auth = req.headers.authorization;
    const token = auth?.split(' ')[1];

    if (!token) {
      return Response.unauthorized(res, 'No access token provided');
    }

    jwt.verify(token, ENV.JWT_SECRET, (err, decoded) => {
      if (err) {
        return Response.unauthorized(res, err.message);
      }

      const payload = decoded as JwtPayload;

      req.userId = payload.id;
      req.userEmail = payload.email;
      req.username = payload.username;
      req.userRole = payload.role;

      next();
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return Response.error(res, null, `Internal server error verifying token: ${errorMessage}`, 500);
  }
};
