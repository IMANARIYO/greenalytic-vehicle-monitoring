import { Response as ExpressResponse } from "express";

class Response {
  static success<T>(
    res: ExpressResponse,
    data: T = {} as T,
    message = "Success",
    statusCode = 200
  ): ExpressResponse {
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
    return this.success(res, data, message, 201);
  }

  static accepted<T>(
    res: ExpressResponse,
    data: T = {} as T,
    message = "Request accepted"
  ): ExpressResponse {
    return this.success(res, data, message, 202);
  }

  static noContent(res: ExpressResponse, message = "No content"): ExpressResponse {
    return res.status(204).send();
  }

  static badRequest(
    res: ExpressResponse,
    message = "Bad request",
    error: unknown = null
  ): ExpressResponse {
    return this.error(res, error, message, 400);
  }

  static unauthorized(
    res: ExpressResponse,
    message = "Unauthorized"
  ): ExpressResponse {
    return this.error(res, null, message, 401);
  }

  static forbidden(res: ExpressResponse, message = "Forbidden"): ExpressResponse {
    return this.error(res, null, message, 403);
  }

  static notFound(
    res: ExpressResponse,
    message = "Resource not found"
  ): ExpressResponse {
    return this.error(res, null, message, 404);
  }

  static conflict(
    res: ExpressResponse,
    message = "Conflict",
    error: unknown = null
  ): ExpressResponse {
    return this.error(res, error, message, 409);
  }

  static unprocessableEntity(
    res: ExpressResponse,
    message = "Unprocessable entity",
    error: unknown = null
  ): ExpressResponse {
    return this.error(res, error, message, 422);
  }

  static tooManyRequests(
    res: ExpressResponse,
    message = "Too many requests"
  ): ExpressResponse {
    return this.error(res, null, message, 429);
  }

  static error(
    res: ExpressResponse,
    error: unknown = null,
    message = "Something went wrong",
    statusCode = 500
  ): ExpressResponse {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error ? error.toString() : undefined,
    });
  }
}

export default Response;
