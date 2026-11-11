import { describe, it, expect } from "vitest";
import { AppError } from "@shared/errors/AppError";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";

describe("AppError Unit Tests", () => {
  it("creates an instance of AppError with correct properties", () => {
    const error = new AppError(
      "Reading not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.READING_NOT_FOUND,
      { readingId: "123" },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe("AppError");
    expect(error.message).toBe("Reading not found");
    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(error.errorCode).toBe(ErrorCode.READING_NOT_FOUND);
    expect(error.details).toEqual({ readingId: "123" });
    expect(error.isOperational).toBe(true);
  });

  it("applies default status 500 and INTERNAL_ERROR when omitted", () => {
    const error = new AppError("Unexpected crash");

    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.details).toBeUndefined();
  });

  it("captures stack trace properly", () => {
    const error = new AppError("Stack trace test");

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe("string");
    expect(error.stack).toContain("AppError");
  });

  it("maintains prototype chain properly", () => {
    const error = new AppError("Prototype test");

    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });
});
