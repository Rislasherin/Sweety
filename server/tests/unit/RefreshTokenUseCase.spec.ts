import { describe, it, expect, vi, beforeEach } from "vitest";
import { RefreshTokenUseCase } from "@application/use-cases/auth/implementations/RefreshTokenUseCase";
import { LogoutUseCase } from "@application/use-cases/auth/implementations/LogoutUseCase";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { type RefreshTokenResult } from "@application/use-cases/auth/interfaces/IRefreshTokenUseCase";
import { InvalidRefreshTokenError } from "@application/errors/InvalidRefreshTokenError";
import { RefreshToken } from "@domain/entities/RefreshToken";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";
import { InMemoryRefreshTokenRepository } from "@infrastructure/repositories/InMemoryRefreshTokenRepository";
import { CryptoRefreshTokenService } from "@infrastructure/services/CryptoRefreshTokenService";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";

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

  it("4. Reuse detection: presenting an already revoked token revokes entire session family immediately", async () => {
    const revokedToken = new RefreshToken({
      id: "token-stolen",
      userId: "user-123",
      tokenHash: "hashed-stolen",
      familyId: "family-stolen-session",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      isRevoked: true,
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

describe("Concurrent Refresh & Token Family Concurrency Strategy", () => {
  it("executes full concurrency and reuse lifecycle with realistic repository", async () => {
    const realCryptoService = new CryptoRefreshTokenService();
    const inMemoryRepo = new InMemoryRefreshTokenRepository();
    const jwtService = new JwtTokenService({
      secret: "secure-test-secret-at-least-32-characters",
      expiresIn: "15m",
      issuer: "sweety-api",
      audience: "sweety-client",
    });

    const user = User.create({
      id: "user-concurrent-1",
      name: "Concurrent User",
      email: Email.create("concurrent@example.com"),
      passwordHash: "bcrypt-hash",
    });

    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(user),
      save: vi.fn(),
    };

    const useCase = new RefreshTokenUseCase(userRepo, inMemoryRepo, jwtService, realCryptoService);

    // Setup: User logs in on Laptop (Family 1) and Phone (Family 2)
    const laptopRawToken = realCryptoService.generateToken();
    const laptopTokenEntity = new RefreshToken({
      id: "token-laptop-1",
      userId: user.id,
      tokenHash: realCryptoService.hashToken(laptopRawToken),
      familyId: "family-laptop",
      expiresAt: realCryptoService.getExpirationDate(),
    });
    await inMemoryRepo.save(laptopTokenEntity);

    const phoneRawToken = realCryptoService.generateToken();
    const phoneTokenEntity = new RefreshToken({
      id: "token-phone-1",
      userId: user.id,
      tokenHash: realCryptoService.hashToken(phoneRawToken),
      familyId: "family-phone",
      expiresAt: realCryptoService.getExpirationDate(),
    });
    await inMemoryRepo.save(phoneTokenEntity);

    // 1. Two legitimate concurrent refresh requests on the same laptop token
    const [res1, res2] = await Promise.allSettled([
      useCase.execute({ refreshToken: laptopRawToken }),
      useCase.execute({ refreshToken: laptopRawToken }),
    ]);

    // 2. Exactly one valid rotation result is produced
    const fulfilledResults = [res1, res2].filter((r) => r.status === "fulfilled");
    const rejectedResults = [res1, res2].filter((r) => r.status === "rejected");

    expect(fulfilledResults).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);

    const successfulResult = (fulfilledResults[0] as PromiseFulfilledResult<RefreshTokenResult>)
      .value;
    expect(successfulResult.accessToken).toBeDefined();
    expect(successfulResult.refreshToken).toBeDefined();
    expect(successfulResult.refreshToken).not.toBe(laptopRawToken);

    // The concurrent duplicate request was rejected cleanly without revoking the family
    const duplicateError = (rejectedResults[0] as PromiseRejectedResult).reason;
    expect(duplicateError).toBeInstanceOf(InvalidRefreshTokenError);
    expect(duplicateError.message).toContain("Refresh request already in progress");

    // Verify family-laptop is NOT revoked: the newly rotated token is valid
    const newLaptopHash = realCryptoService.hashToken(successfulResult.refreshToken);
    const newLaptopToken = await inMemoryRepo.findByTokenHash(newLaptopHash);
    expect(newLaptopToken?.isRevoked).toBe(false);

    // 3. A subsequent request using the genuinely reused old token immediately triggers reuse detection
    await expect(useCase.execute({ refreshToken: laptopRawToken })).rejects.toThrow(
      "Token reuse detected. Session invalidated.",
    );

    // 4. Correct family revocation: laptop family is now completely revoked
    const refreshedLaptopTokenAfterReuse = await inMemoryRepo.findByTokenHash(newLaptopHash);
    expect(refreshedLaptopTokenAfterReuse?.isRevoked).toBe(true);

    // 5. Other independent device/session families (phone) remain completely unaffected
    const phoneTokenAfterIncident = await inMemoryRepo.findByTokenHash(
      realCryptoService.hashToken(phoneRawToken),
    );
    expect(phoneTokenAfterIncident?.isRevoked).toBe(false);

    // Phone can still refresh normally
    const phoneRefreshResult = await useCase.execute({ refreshToken: phoneRawToken });
    expect(phoneRefreshResult.accessToken).toBeDefined();
    expect(phoneRefreshResult.refreshToken).toBeDefined();
  });
});
