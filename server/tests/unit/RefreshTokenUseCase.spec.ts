import { describe, it, expect, vi, beforeEach } from "vitest";
import { RefreshTokenUseCase } from "@application/use-cases/auth/implementations/RefreshTokenUseCase";
import { LogoutUseCase } from "@application/use-cases/auth/implementations/LogoutUseCase";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { InvalidRefreshTokenError } from "@application/errors/InvalidRefreshTokenError";
import { RefreshToken } from "@domain/entities/RefreshToken";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";

describe("RefreshTokenUseCase & Token Rotation Unit Tests", () => {
  let userRepo: IUserRepository;
  let refreshTokenRepo: IRefreshTokenRepository;
  let accessTokenService: ITokenService;
  let refreshTokenService: IRefreshTokenService;
  let useCase: RefreshTokenUseCase;
  let logoutUseCase: LogoutUseCase;

  const mockUser = User.create({
    id: "user-123",
    name: "John Doe",
    email: Email.create("john@example.com"),
    passwordHash: "hash-xyz",
  });

  const validToken = new RefreshToken({
    id: "token-1",
    userId: "user-123",
    tokenHash: "hashed-token-1",
    familyId: "family-abc",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h future
    isRevoked: false,
  });

  beforeEach(() => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    };

    refreshTokenRepo = {
      save: vi.fn(),
      findByTokenHash: vi.fn(),
      revokeFamily: vi.fn(),
      rotateToken: vi.fn(),
      revokeById: vi.fn(),
    };

    accessTokenService = {
      generate: vi.fn().mockReturnValue("fresh-access-jwt"),
      verify: vi.fn(),
    };

    refreshTokenService = {
      generateToken: vi.fn().mockReturnValue("fresh-raw-refresh-token"),
      hashToken: vi.fn((raw: string) => `hashed-${raw}`),
      getExpirationDate: vi.fn().mockReturnValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)),
    };

    useCase = new RefreshTokenUseCase(
      userRepo,
      refreshTokenRepo,
      accessTokenService,
      refreshTokenService,
    );

    logoutUseCase = new LogoutUseCase(refreshTokenRepo, refreshTokenService);
  });

  it("1. Successful refresh rotates token and returns new access token with user details", async () => {
    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(validToken);
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);

    const result = await useCase.execute({ refreshToken: "raw-token-1" });

    expect(refreshTokenService.hashToken).toHaveBeenCalledWith("raw-token-1");
    expect(refreshTokenRepo.rotateToken).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        userId: "user-123",
        familyId: "family-abc", // Maintains same session family
        tokenHash: "hashed-fresh-raw-refresh-token",
      }),
    );
    expect(accessTokenService.generate).toHaveBeenCalledWith({
      userId: "user-123",
      email: "john@example.com",
    });

    expect(result.accessToken).toBe("fresh-access-jwt");
    expect(result.refreshToken).toBe("fresh-raw-refresh-token");
    expect(result.user).toEqual({
      id: "user-123",
      email: "john@example.com",
      name: "John Doe",
    });
  });

  it("2. Missing or empty refresh token throws InvalidRefreshTokenError", async () => {
    await expect(useCase.execute({ refreshToken: "" })).rejects.toThrow(InvalidRefreshTokenError);
    await expect(useCase.execute({ refreshToken: "   " })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("3. Unrecognized refresh token hash throws InvalidRefreshTokenError", async () => {
    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(null);

    await expect(useCase.execute({ refreshToken: "unknown-token" })).rejects.toThrow(
      "Invalid refresh token",
    );
    expect(refreshTokenRepo.rotateToken).not.toHaveBeenCalled();
  });

  it("4. Reuse detection: presenting an already revoked/rotated token revokes entire session family", async () => {
    const revokedToken = new RefreshToken({
      id: "token-stolen",
      userId: "user-123",
      tokenHash: "hashed-stolen",
      familyId: "family-stolen-session",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      isRevoked: true, // Already rotated!
      replacedBy: "token-newer",
    });

    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(revokedToken);

    await expect(useCase.execute({ refreshToken: "stolen" })).rejects.toThrow(
      "Token reuse detected. Session invalidated.",
    );

    // Assert that the entire compromised session family was revoked
    expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith("family-stolen-session");
    expect(refreshTokenRepo.rotateToken).not.toHaveBeenCalled();
  });

  it("5. Expired refresh token is marked revoked and rejected", async () => {
    const expiredToken = new RefreshToken({
      id: "token-expired",
      userId: "user-123",
      tokenHash: "hashed-expired",
      familyId: "family-abc",
      expiresAt: new Date(Date.now() - 1000 * 60), // In past
      isRevoked: false,
    });

    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(expiredToken);

    await expect(useCase.execute({ refreshToken: "expired" })).rejects.toThrow(
      "Refresh token has expired",
    );

    expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith("token-expired");
    expect(refreshTokenRepo.rotateToken).not.toHaveBeenCalled();
  });

  it("6. Logout revokes the token family associated with the refresh token", async () => {
    vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(validToken);

    await logoutUseCase.execute({ refreshToken: "raw-token-1" });

    expect(refreshTokenService.hashToken).toHaveBeenCalledWith("raw-token-1");
    expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith("family-abc");
  });
});
