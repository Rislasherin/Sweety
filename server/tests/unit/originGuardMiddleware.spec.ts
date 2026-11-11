import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import {
  createOriginGuard,
  parseAllowedOrigins,
} from "@presentation/middlewares/originGuardMiddleware";
import { REFRESH_COOKIE_NAME } from "@presentation/controllers/AuthController";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";

describe("OriginGuardMiddleware Unit Tests", () => {
  const allowedOrigins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      headers: {},
      cookies: {},
    };
    res = {
      status: statusMock as unknown as Response["status"],
    };
    next = vi.fn();
  });

  it("1. Allows requests with an explicitly whitelisted Origin header", () => {
    req.headers = { origin: "http://localhost:3001" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("2. Rejects requests from an unlisted Origin header with HTTP 403", () => {
    req.headers = { origin: "https://malicious-site.com" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden: Untrusted origin",
        errorCode: ErrorCode.FORBIDDEN,
      }),
    );
  });

  it("3. Normalizes trailing slashes on incoming Origin headers", () => {
    req.headers = { origin: "http://localhost:5173///" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("4. Allows fallback to Referer header when Origin is absent and Referer origin is whitelisted", () => {
    req.headers = { referer: "http://localhost:3001/auth/login?redirect=/dashboard" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("5. Rejects untrusted Referer header with HTTP 403 when Origin is absent", () => {
    req.headers = { referer: "https://evil.org/phishing-page" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden: Untrusted referer origin",
        errorCode: ErrorCode.FORBIDDEN,
      }),
    );
  });

  it("6. Rejects malformed Referer header with HTTP 403", () => {
    req.headers = { referer: "not-a-valid-url" };
    const guard = createOriginGuard({ allowedOrigins });

    guard(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden: Malformed referer header",
        errorCode: ErrorCode.FORBIDDEN,
      }),
    );
  });

  it("7. In production: strictly rejects cookie-authenticated requests missing Origin and Referer", () => {
    req.headers = {};
    req.cookies = { [REFRESH_COOKIE_NAME]: "some-refresh-token-value" };
    const guard = createOriginGuard({ allowedOrigins, isProduction: true });

    guard(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden: Origin or Referer header required for cookie-authenticated requests",
        errorCode: ErrorCode.FORBIDDEN,
      }),
    );
  });

  it("8. In non-production: permits cookie requests without Origin (supports local tests/tools)", () => {
    req.headers = {};
    req.cookies = { [REFRESH_COOKIE_NAME]: "some-refresh-token-value" };
    const guard = createOriginGuard({ allowedOrigins, isProduction: false });

    guard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("9. In production: permits programmatic body-only requests without cookies and without Origin", () => {
    req.headers = {};
    req.cookies = {}; // No browser cookies attached
    req.body = { refreshToken: "raw-refresh-token" };
    const guard = createOriginGuard({ allowedOrigins, isProduction: true });

    guard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("10. Production CORS: parseAllowedOrigins extracts only explicitly configured origins", () => {
    const origins = parseAllowedOrigins("https://sweety.app, https://client.sweety.app/");

    expect(origins).toEqual(["https://sweety.app", "https://client.sweety.app"]);
    expect(origins).not.toContain("http://localhost:5173");
  });
});
