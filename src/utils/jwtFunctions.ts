import jwt from 'jsonwebtoken';
import { Request, Response as ExpressResponse, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import { JwtPayload } from '../types/jwtPayload.js';
import Response from './response.js';
import { catchAsync } from '../middlewares/errorHandler.js'; // Adjust path as needed
import logger from './logger.js';

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

// Create a helper function that returns a Promise for jwt.verify
const verifyTokenAsync = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, ENV.JWT_SECRET as string, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as JwtPayload);
    });
  });
};

// Now define verifyingtoken as async and wrap with catchAsync
export const verifyingtoken = catchAsync(async (
  req: AuthenticatedRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  const auth = req.headers.authorization;
  const token = auth?.split(' ')[1];

  if (!token) {

    return Response.unauthorized(res, 'No access token provided');
  }

  // Await the token verification
  const payload = await verifyTokenAsync(token);

  // Attach user data to request
  req.userId = payload.id;
  req.userEmail = payload.email;
  req.username = payload.username;
  req.userRole = payload.role;

  next();
});
