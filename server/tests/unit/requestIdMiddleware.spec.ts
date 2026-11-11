import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import {
  requestIdMiddleware,
  isValidRequestId,
} from "@presentation/middlewares/requestIdMiddleware";

describe("requestIdMiddleware Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let setHeaderMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setHeaderMock = vi.fn();
    req = {
      headers: {},
    };
    res = {
      setHeader: setHeaderMock,
    };
    next = vi.fn();
  });

  it("1. Generates a fresh UUID when no incoming X-Request-Id header is present", () => {
    const middleware = requestIdMiddleware();
    middleware(req as Request, res as Response, next);

    expect(req.id).toBeDefined();
    expect(req.requestId).toBeDefined();
    expect(req.id).toBe(req.requestId);
    // UUID regex check
    expect(req.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(setHeaderMock).toHaveBeenCalledWith("X-Request-Id", req.id);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("2. Reuses valid incoming X-Request-Id header", () => {
    const validIncomingId = "custom-client-trace-id-12345";
    req.headers = { "x-request-id": validIncomingId };

    const middleware = requestIdMiddleware();
    middleware(req as Request, res as Response, next);

    expect(req.id).toBe(validIncomingId);
    expect(req.requestId).toBe(validIncomingId);
    expect(setHeaderMock).toHaveBeenCalledWith("X-Request-Id", validIncomingId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("3. Rejects invalid or unsafe incoming request IDs and generates a new UUID", () => {
    // Too short, contains special characters/injection attempt
    const invalidIds = ["short", "id with spaces", "semi;colon", "<script>alert(1)</script>"];

    for (const invalidId of invalidIds) {
      req.headers = { "x-request-id": invalidId };
      setHeaderMock.mockClear();

      const middleware = requestIdMiddleware();
      middleware(req as Request, res as Response, next);

      expect(req.id).not.toBe(invalidId);
      expect(req.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(setHeaderMock).toHaveBeenCalledWith("X-Request-Id", req.id);
    }
  });

  it("4. isValidRequestId validates correct character and length boundaries", () => {
    expect(isValidRequestId("valid-request-id-12345")).toBe(true);
    expect(isValidRequestId("12345678")).toBe(true); // 8 chars minimum
    expect(isValidRequestId("1234567")).toBe(false); // 7 chars is too short
    expect(isValidRequestId(null)).toBe(false);
    expect(isValidRequestId(undefined)).toBe(false);
    expect(isValidRequestId(12345678)).toBe(false);
    expect(isValidRequestId("a".repeat(129))).toBe(false); // >128 chars is too long
  });
});
