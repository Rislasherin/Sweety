import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { errorHandler } from "@presentation/middlewares/errorMiddleware";
import { AppError } from "@shared/errors/AppError";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";
import { Messages } from "@shared/constants/messages.constants";
import { logger } from "@infrastructure/logging/logger";

describe("Global errorMiddleware Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = vi.fn();

    // Suppress console.error in tests for unexpected errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("1. Preserves AppError status, error code, message and optional details", () => {
    const error = new AppError(
      "Reading not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.READING_NOT_FOUND,
      { readingId: "read-123" },
    );

    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Reading not found",
      errorCode: ErrorCode.READING_NOT_FOUND,
      details: { readingId: "read-123" },
    });
  });

  it("2. Handles DTO validation errors returning 400 Bad Request with field errors", () => {
    const validationError = {
      name: "ValidationError",
      message: "Validation failed",
      errors: [
        { field: "email", message: "Email is not valid" },
        { field: "password", message: "Password must be at least 8 characters" },
      ],
    };

    errorHandler(validationError, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      errorCode: ErrorCode.VALIDATION_ERROR,
      errors: validationError.errors,
    });
  });

  it("3. Maps Prisma P2002 error to 409 Conflict without leaking SQL or DB internals", () => {
    const prismaP2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the constraint: users_email_key in SELECT * FROM users",
      {
        code: "P2002",
        clientVersion: "6.19.3",
      },
    );

    errorHandler(prismaP2002, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "A resource with these details already exists",
      errorCode: ErrorCode.CONFLICT,
    });
    const responsePayload = jsonMock.mock.calls[0][0];
    expect(JSON.stringify(responsePayload)).not.toContain("SELECT");
    expect(JSON.stringify(responsePayload)).not.toContain("users_email_key");
  });

  it("4. Maps Prisma P2025 error to 404 Not Found without leaking DB internals", () => {
    const prismaP2025 = new Prisma.PrismaClientKnownRequestError(
      "An operation failed because it depends on one or more records that were required but not found.",
      {
        code: "P2025",
        clientVersion: "6.19.3",
      },
    );

    errorHandler(prismaP2025, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: Messages.ERROR.RESOURCE_NOT_FOUND,
      errorCode: ErrorCode.NOT_FOUND,
    });
  });

  it("5. Maps Prisma P2003 foreign key violation to 400 Bad Request", () => {
    const prismaP2003 = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed on the field: `userId`",
      {
        code: "P2003",
        clientVersion: "6.19.3",
      },
    );

    errorHandler(prismaP2003, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Related resource constraint violation",
      errorCode: ErrorCode.DATABASE_ERROR,
    });
  });

  it("6. Handles unexpected errors returning 500 without leaking stack trace or secrets", () => {
    const unexpectedError = new Error(
      "Failed to connect to postgresql://postgres:secret_pass@127.0.0.1:5432/sweety_db",
    );

    errorHandler(unexpectedError, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: Messages.ERROR.INTERNAL_SERVER_ERROR,
    });
    const payload = jsonMock.mock.calls[0][0];
    expect(payload.stack).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("secret_pass");
    expect(JSON.stringify(payload)).not.toContain("postgresql://");
  });

  it("7. Handles JWT invalid token and expired token errors", () => {
    const jwtInvalid = { name: "JsonWebTokenError", message: "invalid signature" };
    errorHandler(jwtInvalid, req as Request, res as Response, next);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: Messages.AUTH.TOKEN_INVALID_OR_EXPIRED,
      errorCode: ErrorCode.INVALID_TOKEN,
    });

    statusMock.mockClear();
    jsonMock.mockClear();

    const jwtExpired = { name: "TokenExpiredError", message: "jwt expired" };
    errorHandler(jwtExpired, req as Request, res as Response, next);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: Messages.AUTH.TOKEN_INVALID_OR_EXPIRED,
      errorCode: ErrorCode.TOKEN_EXPIRED,
    });
  });

  it("8. Logs structured error context via Pino with reqId, method, path, and statusCode", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
    req.id = "trace-uuid-12345";
    req.method = "POST";
    req.path = "/api/test-failure";

    const error = new Error("Database network socket closed");
    errorHandler(error, req as Request, res as Response, next);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reqId: "trace-uuid-12345",
        method: "POST",
        path: "/api/test-failure",
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        err: error,
      }),
      expect.any(String),
    );
  });
});
