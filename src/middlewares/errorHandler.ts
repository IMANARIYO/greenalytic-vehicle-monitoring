import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
// import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
const { JsonWebTokenError, TokenExpiredError } = jwt;
// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  code?: string;
  meta?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  status: string;
  message: string;
  timestamp: string;
  error?: any;
  stack?: string;
  details?: ErrorDetails;
  requestId?: string;
  path?: string;
}

export interface FieldMapping {
  name: string;
  values: string[];
}

export type ErrorStatus = 'error' | 'fail';

export type PrismaErrorCode = 
  | 'P2002' // Unique constraint violation
  | 'P2025' // Record not found
  | 'P2003' // Foreign key constraint violation
  | 'P2014' // Required relation violation
  | 'P2021' // Table does not exist
  | 'P2022' // Column does not exist
  | 'P2000' // Value too long
  | 'P2001' // Record does not exist
  | 'P2015' // Related record not found
  | 'P2016' // Query interpretation error
  | 'P2017' // Records for relation not connected
  | 'P2018' // Required connected records not found
  | 'P2019' // Input error
  | 'P2020' // Value out of range;

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  FLEET_MANAGER = 'FLEET_MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  ANALYST = 'ANALYST',
  SUPPORT_AGENT = 'SUPPORT_AGENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}

export enum VehicleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  BUS = 'BUS',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER'
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID'
}

export enum DeviceCategory {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  TRICYCLE = 'TRICYCLE',
  OTHER = 'OTHER'
}

export enum Language {
  ENGLISH = 'English',
  FRENCH = 'French',
  KINYARWANDA = 'Kinyarwanda'
}

export enum NotificationPreference {
  EMAIL = 'Email',
  SMS = 'SMS',
  WHATSAPP = 'WhatsApp'
}

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: ErrorStatus;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: ErrorDetails;
  public readonly requestId?: string;
  public readonly path?: string;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: ErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  public setRequestId(requestId: string): this {
    (this as any).requestId = requestId;
    return this;
  }

  public setPath(path: string): this {
    (this as any).path = path;
    return this;
  }

  public toJSON(): ErrorResponse {
    return {
      success: false,
      status: this.status,
      message: this.message,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.path && { path: this.path }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, HttpStatusCode.BAD_REQUEST, { field, value });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatusCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super(message, HttpStatusCode.CONFLICT, { field });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, HttpStatusCode.TOO_MANY_REQUESTS);
  }
}

// =============================================================================
// ASYNC WRAPPER
// =============================================================================

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// =============================================================================
// ERROR HANDLERS
// =============================================================================

export const handleNotFoundRoutes = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  error.setPath(req.originalUrl);
  next(error);
};

// Field mappings for validation errors
const FIELD_MAPPINGS: Record<string, FieldMapping> = {
  role: { name: 'Role', values: Object.values(UserRole) },
  status: { name: 'Status', values: Object.values(UserStatus) },
  vehicleType: { name: 'Vehicle Type', values: Object.values(VehicleType) },
  fuelType: { name: 'Fuel Type', values: Object.values(FuelType) },
  deviceCategory: { name: 'Device Category', values: Object.values(DeviceCategory) },
  language: { name: 'Language', values: Object.values(Language) },
  notificationPreference: { name: 'Notification Preference', values: Object.values(NotificationPreference) }
};

export const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): AppError => {
  const code = err.code as PrismaErrorCode;
  
  switch (code) {
    case 'P2002':
      // Unique constraint violation
      const target = err.meta?.target as string[] | undefined;
      const field = (target && target.length > 0) ? target[0] : 'field';
      return new ConflictError(`${field} already exists. Please use a different value.`, field);
    
    case 'P2025':
      // Record not found
      return new NotFoundError('The requested resource was not found');
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Cannot perform this operation due to related data constraints.');
    
    case 'P2014':
      // Required relation violation
      return new ValidationError('Required relationship constraint violation.');
    
    case 'P2021':
      // Table does not exist
      return new AppError('Database configuration error. Please contact support.', HttpStatusCode.INTERNAL_SERVER_ERROR);
    
    case 'P2022':
      // Column does not exist
      return new AppError('Database schema error. Please contact support.', HttpStatusCode.INTERNAL_SERVER_ERROR);
    
    case 'P2000':
      // Value too long
      return new ValidationError('Input value is too long for the field.');
    
    case 'P2001':
      // Record does not exist
      return new NotFoundError('Record does not exist');
    
    case 'P2015':
      // Related record not found
      return new NotFoundError('Related record not found');
    
    case 'P2016':
      // Query interpretation error
      return new ValidationError('Invalid query parameters.');
    
    default:
      return new AppError('Database operation failed.', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

const handleValidationError = (err: Error): AppError => {
  if (err.message.includes('Invalid enum value')) {
    // Extract field name from error message
    const enumMatch = err.message.match(/Invalid enum value.*?for field `(\w+)`/);
    const field = enumMatch ? enumMatch[1] : 'field';
    
    const mapping = FIELD_MAPPINGS[field];
    if (mapping) {
      return new ValidationError(
        `Invalid ${mapping.name}. Must be one of: ${mapping.values.join(', ')}`,
        field
      );
    }
    
    return new ValidationError(`Invalid value for ${field}. Please check the allowed values.`, field);
  }
  
  if (err.message.includes('Argument') && err.message.includes('is missing')) {
    return new ValidationError('Required field is missing. Please provide all required information.');
  }
  
  return new ValidationError('Validation error. Please check your input data.');
};

const handleAuthenticationError = (err: Error): AppError => {
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid authentication token. Please log in again.');
  }
  
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Your session has expired. Please log in again.');
  }
  
  return new UnauthorizedError('Authentication failed.');
};

const handleAuthorizationError = (err: Error): AppError => {
  if (err.message.includes('Forbidden') || err.message.includes('insufficient permissions')) {
    return new ForbiddenError('You do not have permission to perform this action.');
  }
  
  return new ForbiddenError('Access denied.');
};

const handleCastError = (err: any): AppError => {
  if (err.path === 'id' || err.path === '_id') {
    return new ValidationError('Invalid ID format.', err.path, err.value);
  }
  
  return new ValidationError(`Invalid ${err.path}: ${err.value}`, err.path, err.value);
};

const handleFileUploadError = (err: any): AppError => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File size too large. Maximum size allowed is 5MB.');
    
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files. Maximum 5 files allowed.');
    
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field. Please check the upload requirements.');
    
    case 'FILETYPE_NOT_ALLOWED':
      return new ValidationError('File type not allowed. Please upload a valid file.');
    
    default:
      return new ValidationError('File upload failed.');
  }
};

// =============================================================================
// RESPONSE HANDLERS
// =============================================================================

const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  if (res.headersSent) {
    console.error('Cannot send error response - headers already sent:', err);
    return;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    status: err.status,
    message: err.message,
    timestamp: err.timestamp,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...err.details
    },
    stack: err.stack,
    ...(err.details && { details: err.details }),
    ...(err.requestId && { requestId: err.requestId }),
    path: req.originalUrl
  };

  res.status(err.statusCode).json(errorResponse);
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  if (res.headersSent) {
    console.error('Cannot send error response - headers already sent:', err);
    return;
  }

  // Only send operational errors to client
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      success: false,
      status: err.status,
      message: err.message,
      timestamp: err.timestamp,
      ...(err.details && { details: err.details }),
      ...(err.requestId && { requestId: err.requestId })
    };

    res.status(err.statusCode).json(errorResponse);
  } else {
    // Log error for debugging but don't expose details
    console.error('ERROR 💥:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      timestamp: err.timestamp,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const errorResponse: ErrorResponse = {
      success: false,
      status: 'error',
      message: 'Something went wrong! Please try again later.',
      timestamp: new Date().toISOString()
    };

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// =============================================================================
// MAIN ERROR HANDLER
// =============================================================================

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substring(2, 15);

  // Log the error for debugging
  console.error('ERROR 💥:', {
    name: err.name || 'Unknown Error',
    message: err.message || 'An unexpected error occurred',
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId
  });

  // Check if response has already been sent
  if (res.headersSent) {
    console.log('Headers already sent, cannot send error response');
    return next(err);
  }

  let error: AppError;

  // Convert different error types to AppError
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = handleValidationError(err);
  } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    error = handleAuthenticationError(err);
  } else if (err.name === 'ValidationError' || err.message.includes('Invalid enum')) {
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if ((err as any).statusCode === HttpStatusCode.FORBIDDEN) {
    error = handleAuthorizationError(err);
  } else if ((err as any).statusCode === HttpStatusCode.TOO_MANY_REQUESTS) {
    error = new RateLimitError();
  } else if (err.name === 'MulterError' || (err as any).code?.startsWith('LIMIT_')) {
    error = handleFileUploadError(err);
  } else {
    // Unknown error - create generic AppError
    error = new AppError(
      err.message || 'Something went wrong',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      undefined,
      false // Non-operational error
    );
  }

  // Set request ID and path
  error.setRequestId(requestId).setPath(req.originalUrl);

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// =============================================================================
// API NOT FOUND HANDLER
// =============================================================================

export const handleApiNotFound = (req: Request, res: Response): void => {
  if (res.headersSent) {
    return;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    status: 'fail',
    message: `API endpoint ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  res.status(HttpStatusCode.NOT_FOUND).json({
    ...errorResponse,
    availableEndpoints: {
      users: '/api/users',
      vehicles: '/api/vehicles',
      emissions: '/api/emissions',
      tracking: '/api/tracking-devices',
      dashboard: '/api/dashboard'
    }
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const createErrorResponse = (
  message: string,
  statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
  details?: ErrorDetails
): AppError => {
  return new AppError(message, statusCode, details);
};

export const createValidationError = (
  field: string,
  value?: any,
  allowedValues?: string[]
): ValidationError => {
  let message = `Invalid ${field}`;
  if (value !== undefined) {
    message += `: ${value}`;
  }
  if (allowedValues && allowedValues.length > 0) {
    message += `. Must be one of: ${allowedValues.join(', ')}`;
  }
  return new ValidationError(message, field, value);
};

export const createNotFoundError = (resource: string = 'Resource'): NotFoundError => {
  return new NotFoundError(resource);
};

export const createUnauthorizedError = (message?: string): UnauthorizedError => {
  return new UnauthorizedError(message);
};

export const createForbiddenError = (message?: string): ForbiddenError => {
  return new ForbiddenError(message);
};

export const createConflictError = (message: string, field?: string): ConflictError => {
  return new ConflictError(message, field);
};

// =============================================================================
// MIDDLEWARE FOR REQUEST ID
// =============================================================================

export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = Math.random().toString(36).substring(2, 15);
  }
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
};

// =============================================================================
// HEALTH CHECK ERROR HANDLER
// =============================================================================

export const handleHealthCheck = (req: Request, res: Response): void => {
  res.status(HttpStatusCode.OK).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
};