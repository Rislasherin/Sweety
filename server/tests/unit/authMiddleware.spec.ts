import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import { createAuthMiddleware } from "@presentation/middlewares/authMiddleware";
import { type ITokenService } from "@application/interfaces/ITokenService";

describe("createAuthMiddleware Unit Tests", () => {
  let tokenService: ITokenService;
  let authMiddleware: ReturnType<typeof createAuthMiddleware>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenService = {
      generate: vi.fn(),
      verify: vi.fn(),
    };

    authMiddleware = createAuthMiddleware(tokenService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {
      headers: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
    };

    next = vi.fn();
  });

  it("1. Rejects missing Authorization header with 401", () => {
    req.headers = {};

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Authentication token missing",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("2. Rejects non-Bearer Authorization header with 401", () => {
    req.headers = { authorization: "Basic dXNlcjpwYXNz" };

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Authentication token missing",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("3. Rejects empty Bearer token with 401", () => {
    req.headers = { authorization: "Bearer " };

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Authentication token missing",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("4. Rejects invalid token with 401", () => {
    req.headers = { authorization: "Bearer invalid.token.value" };
    vi.mocked(tokenService.verify).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("5. Rejects expired token with 401", () => {
    req.headers = { authorization: "Bearer expired.token.value" };
    vi.mocked(tokenService.verify).mockImplementation(() => {
      throw new Error("jwt expired");
    });

    authMiddleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("6. Attaches authenticated user to request and calls next() on valid token", () => {
    req.headers = { authorization: "Bearer valid.jwt.token" };
    vi.mocked(tokenService.verify).mockReturnValue({
      userId: "user-123",
      email: "user@example.com",
    });

    authMiddleware(req as Request, res as Response, next);

    expect(req.user).toEqual({
      id: "user-123",
      email: "user@example.com",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });
});
