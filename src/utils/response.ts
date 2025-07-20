import { Response as ExpressResponse } from "express";
import logger from './logger.js'; // adjust path as needed

class Response {
  static success<T>(
    res: ExpressResponse,
    data: T = {} as T,
    message = "Success",
    statusCode = 200
  ): ExpressResponse {
    logger.info(`Success: ${message}`);
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T>(
    res: ExpressResponse,
    data: T = {} as T,
    message = "Resource created successfully"
  ): ExpressResponse {
    logger.info(`Created: ${message}`);
    return this.success(res, data, message, 201);
  }

  static accepted<T>(
    res: ExpressResponse,
    data: T = {} as T,
    message = "Request accepted"
  ): ExpressResponse {
    logger.info(`Accepted: ${message}`);
    return this.success(res, data, message, 202);
  }

  static noContent(res: ExpressResponse, message = "No content"): ExpressResponse {
    logger.info(`No content: ${message}`);
    return res.status(204).send();
  }

  static badRequest(
    res: ExpressResponse,
    message = "Bad request",
    error: unknown = null
  ): ExpressResponse {
    logger.warn(`Bad Request: ${message} - Error: ${error?.toString() || "N/A"}`);
    return this.error(res, error, message, 400);
  }

  static unauthorized(
    res: ExpressResponse,
    message = "Unauthorized"
  ): ExpressResponse {
    logger.warn(`Unauthorized: ${message}`);
    return this.error(res, null, message, 401);
  }

  static forbidden(res: ExpressResponse, message = "Forbidden"): ExpressResponse {
    logger.warn(`Forbidden: ${message}`);
    return this.error(res, null, message, 403);
  }

  static notFound(
    res: ExpressResponse,
    message = "Resource not found"
  ): ExpressResponse {
    logger.warn(`Not Found: ${message}`);
    return this.error(res, null, message, 404);
  }

  static conflict(
    res: ExpressResponse,
    message = "Conflict",
    error: unknown = null
  ): ExpressResponse {
    logger.warn(`Conflict: ${message} - Error: ${error?.toString() || "N/A"}`);
    return this.error(res, error, message, 409);
  }

  static unprocessableEntity(
    res: ExpressResponse,
    message = "Unprocessable entity",
    error: unknown = null
  ): ExpressResponse {
    logger.warn(`Unprocessable Entity: ${message} - Error: ${error?.toString() || "N/A"}`);
    return this.error(res, error, message, 422);
  }

  static tooManyRequests(
    res: ExpressResponse,
    message = "Too many requests"
  ): ExpressResponse {
    logger.warn(`Too Many Requests: ${message}`);
    return this.error(res, null, message, 429);
  }

  static error(
    res: ExpressResponse,
    error: unknown = null,
    message = "Something went wrong",
    statusCode = 500
  ): ExpressResponse {
    logger.error(`Error: ${message} - ${error?.toString() || "No error details"}`);
    return res.status(statusCode).json({
      success: false,
      message,
      error: error ? error.toString() : undefined,
    });
  }
}

export default Response;
