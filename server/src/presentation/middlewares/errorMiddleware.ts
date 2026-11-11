import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "@shared/errors/AppError";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";
import { Messages } from "@shared/constants/messages.constants";
import { logger } from "@infrastructure/logging/logger";
import { UserAlreadyExistsError } from "@application/errors/UserAlreadyExistsError";
import { InvalidCredentialsError } from "@application/errors/InvalidCredentialsError";
import { InvalidRefreshTokenError } from "@application/errors/InvalidRefreshTokenError";
import {
  ReadingNotFoundError,
  DuplicateReadingSlotError,
  DailyReadingLimitExceededError,
  FutureDateError,
  InvalidDateError,
} from "@domain/errors/ReadingErrors";
import { DomainError } from "@domain/errors/DomainError";

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,

  _next: NextFunction,
): void => {
  const reqId = req.id ?? req.requestId;
  const method = req.method;
  const path = req.originalUrl || req.path;

  // 1. Centralized Application Errors (AppError)
  if (err instanceof AppError) {
    logger.warn(
      { reqId, method, path, statusCode: err.statusCode, errorCode: err.errorCode },
      `Application Error: ${err.message}`,
    );

    const responseBody: Record<string, unknown> = {
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    };

    if (err.details !== undefined) {
      responseBody.details = err.details;
    }

    res.status(err.statusCode).json(responseBody);
    return;
  }

  // 2. Domain & Application specific errors
  if (err instanceof ReadingNotFoundError) {
    logger.warn({ reqId, method, path, statusCode: HttpStatus.NOT_FOUND }, err.message);
    res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof UserAlreadyExistsError || err instanceof DuplicateReadingSlotError) {
    logger.warn({ reqId, method, path, statusCode: HttpStatus.CONFLICT }, err.message);
    res.status(HttpStatus.CONFLICT).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof InvalidCredentialsError || err instanceof InvalidRefreshTokenError) {
    logger.warn({ reqId, method, path, statusCode: HttpStatus.UNAUTHORIZED }, err.message);
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (
    err instanceof DailyReadingLimitExceededError ||
    err instanceof FutureDateError ||
    err instanceof InvalidDateError ||
    err instanceof DomainError
  ) {
    logger.warn({ reqId, method, path, statusCode: HttpStatus.BAD_REQUEST }, err.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // 3. Validation / DTO errors
  if (
    err &&
    typeof err === "object" &&
    ("errors" in err || (err as { name?: string }).name === "ValidationError")
  ) {
    const errorObj = err as { message?: string; errors?: unknown };
    logger.warn(
      {
        reqId,
        method,
        path,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      },
      "Request validation failure",
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: errorObj.message || Messages.ERROR.VALIDATION_FAILED,
      errorCode: ErrorCode.VALIDATION_ERROR,
      ...(errorObj.errors ? { errors: errorObj.errors } : {}),
    });
    return;
  }

  // 4. JWT Authentication errors
  if (err && typeof err === "object" && "name" in err) {
    const errName = (err as { name?: string }).name;
    if (errName === "JsonWebTokenError") {
      logger.warn(
        {
          reqId,
          method,
          path,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCode.INVALID_TOKEN,
        },
        "JWT signature or format invalid",
      );
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: Messages.AUTH.TOKEN_INVALID_OR_EXPIRED,
        errorCode: ErrorCode.INVALID_TOKEN,
      });
      return;
    }

    if (errName === "TokenExpiredError") {
      logger.warn(
        {
          reqId,
          method,
          path,
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCode.TOKEN_EXPIRED,
        },
        "JWT token has expired",
      );
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: Messages.AUTH.TOKEN_INVALID_OR_EXPIRED,
        errorCode: ErrorCode.TOKEN_EXPIRED,
      });
      return;
    }
  }

  // 5. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint violation
        logger.warn(
          { reqId, method, path, statusCode: HttpStatus.CONFLICT, code: err.code },
          "Database unique constraint conflict",
        );
        res.status(HttpStatus.CONFLICT).json({
          success: false,
          message: "A resource with these details already exists",
          errorCode: ErrorCode.CONFLICT,
        });
        return;

      case "P2025": // Record not found
        logger.warn(
          { reqId, method, path, statusCode: HttpStatus.NOT_FOUND, code: err.code },
          "Database record not found",
        );
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: Messages.ERROR.RESOURCE_NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
        return;

      case "P2003": // Foreign key constraint violation
        logger.warn(
          { reqId, method, path, statusCode: HttpStatus.BAD_REQUEST, code: err.code },
          "Database foreign key constraint violation",
        );
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Related resource constraint violation",
          errorCode: ErrorCode.DATABASE_ERROR,
        });
        return;

      default:
        logger.error(
          { reqId, method, path, code: err.code, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
          "Prisma known request error",
        );
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: Messages.ERROR.DATABASE_ERROR,
          errorCode: ErrorCode.DATABASE_ERROR,
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error(
      { reqId, method, path, statusCode: HttpStatus.SERVICE_UNAVAILABLE },
      "Database initialization or connection failure",
    );
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      success: false,
      message: Messages.ERROR.SERVICE_UNAVAILABLE,
      errorCode: ErrorCode.DATABASE_ERROR,
    });
    return;
  }

  // 6. Generic / Unexpected errors - log full details securely, never expose to clients
  logger.error(
    { err, reqId, method, path, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
    "Unhandled unexpected server error",
  );

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: Messages.ERROR.INTERNAL_SERVER_ERROR,
  });
};
