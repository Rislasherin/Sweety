import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { AuthFactory } from "@infrastructure/di/factories/AuthFactory";
import { Container } from "@infrastructure/di/Container";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";
import { RefreshToken } from "@domain/entities/RefreshToken";
import { REFRESH_COOKIE_NAME } from "@presentation/controllers/AuthController";

describe("Refresh Token & Session Lifecycle (HTTP Integration)", () => {
  let userRepo: IUserRepository;
  let refreshTokenRepo: IRefreshTokenRepository;
  let passwordService: IPasswordService;
  let accessTokenService: ITokenService;
  let refreshTokenService: IRefreshTokenService;
  let app: ReturnType<typeof createApp>;

  const mockUser = User.create({
    id: "user-456",
    name: "Alice Smith",
    email: Email.create("alice@example.com"),
    passwordHash: "hashed-pwd",
  });

  beforeEach(() => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockUser),
      save: vi.fn(),
    };

    refreshTokenRepo = {
      save: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeFamily: vi.fn(),
      rotateToken: vi.fn(),
      revokeById: vi.fn(),
    };

    passwordService = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };

    accessTokenService = {
      generate: vi.fn().mockReturnValue("mock-access-token-jwt"),
      verify: vi.fn().mockReturnValue({ userId: "user-456", email: "alice@example.com" }),
    };

    refreshTokenService = {
      generateToken: vi.fn().mockReturnValue("generated-opaque-refresh-token"),
      hashToken: vi.fn((raw: string) => `hash-${raw}`),
      getExpirationDate: vi.fn().mockReturnValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)),
    };

    const authFactory = new AuthFactory({} as never, userRepo, {
      userRepository: userRepo,
      refreshTokenRepository: refreshTokenRepo,
      passwordService,
      accessTokenService,
      refreshTokenService,
    });

    const container = new Container();
    vi.spyOn(container, "authController", "get").mockReturnValue(authFactory.getAuthController());
    vi.spyOn(container, "authMiddleware", "get").mockReturnValue(authFactory.getAuthMiddleware());

    app = createApp({ container });
  });

  it("1. POST /api/auth/login sets HttpOnly refresh cookie and returns access token without cookie in body", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);

    const response = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBe("mock-access-token-jwt");
    expect(response.body.data).not.toHaveProperty("refreshToken");

    // Assert that Set-Cookie header is present with HttpOnly
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    const refreshCookie = cookies?.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("Path=/api/auth");
  });

  it("2. POST /api/auth/refresh rotates token, updates HttpOnly cookie and returns new access token", async () => {
    const activeToken = new RefreshToken({
      id: "token-active-1",
      userId: "user-456",
      tokenHash: "hash-valid-cookie-token",
      familyId: "session-family-1",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      isRevoked: false,
    });

    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(activeToken);

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`${REFRESH_COOKIE_NAME}=valid-cookie-token`]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBe("mock-access-token-jwt");
    expect(response.body.data.user.email).toBe("alice@example.com");

    expect(refreshTokenRepo.rotateToken).toHaveBeenCalledWith(
      "token-active-1",
      expect.objectContaining({
        familyId: "session-family-1",
        tokenHash: "hash-generated-opaque-refresh-token",
      }),
    );

    // Assert updated Set-Cookie header
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    const updatedCookie = cookies?.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
    expect(updatedCookie).toBeDefined();
    expect(updatedCookie).toContain("HttpOnly");
  });

  it("3. POST /api/auth/refresh detects reuse of rotated token and revokes entire session family", async () => {
    const revokedToken = new RefreshToken({
      id: "token-already-rotated",
      userId: "user-456",
      tokenHash: "hash-stolen-token",
      familyId: "session-family-stolen",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      isRevoked: true,
      replacedBy: "token-newer",
    });

    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(revokedToken);

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`${REFRESH_COOKIE_NAME}=stolen-token`]);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Token reuse detected");
    expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith("session-family-stolen");
  });

  it("4. POST /api/auth/logout revokes session family and clears refresh cookie", async () => {
    const activeToken = new RefreshToken({
      id: "token-to-logout",
      userId: "user-456",
      tokenHash: "hash-logout-token",
      familyId: "session-family-logout",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      isRevoked: false,
    });

    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(activeToken);

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`${REFRESH_COOKIE_NAME}=logout-token`]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");
    expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith("session-family-logout");

    // Cookie must be cleared (expired or empty)
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    const clearedCookie = cookies?.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
    expect(clearedCookie).toBeDefined();
    expect(clearedCookie).toMatch(/(Expires=Thu, 01 Jan 1970|Max-Age=0)/);
  });
});
