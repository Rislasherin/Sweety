import crypto from "node:crypto";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { InvalidRefreshTokenError } from "@application/errors/InvalidRefreshTokenError";
import { RefreshToken } from "@domain/entities/RefreshToken";
import {
  type IRefreshTokenUseCase,
  type RefreshTokenRequest,
  type RefreshTokenResult,
} from "../interfaces/IRefreshTokenUseCase";

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _refreshTokenRepo: IRefreshTokenRepository,
    private readonly _accessTokenService: ITokenService,
    private readonly _refreshTokenService: IRefreshTokenService,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResult> {
    const rawToken = request.refreshToken?.trim();
    if (!rawToken) {
      throw new InvalidRefreshTokenError("Refresh token is required");
    }

    const tokenHash = this._refreshTokenService.hashToken(rawToken);
    const existingToken = await this._refreshTokenRepo.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new InvalidRefreshTokenError("Invalid refresh token");
    }

    // Reuse detection: If token is already revoked, an attacker or compromised party reused an old token!
    if (existingToken.isRevoked) {
      // Invalidate the entire token family/session
      await this._refreshTokenRepo.revokeFamily(existingToken.familyId);
      throw new InvalidRefreshTokenError("Token reuse detected. Session invalidated.");
    }

    // Expiration check
    if (existingToken.isExpired()) {
      await this._refreshTokenRepo.revokeById(existingToken.id);
      throw new InvalidRefreshTokenError("Refresh token has expired");
    }

    // Fetch user
    const user = await this._userRepo.findById(existingToken.userId);
    if (!user) {
      throw new InvalidRefreshTokenError("User account not found");
    }

    // Generate rotated tokens
    const newRawRefreshToken = this._refreshTokenService.generateToken();
    const newTokenHash = this._refreshTokenService.hashToken(newRawRefreshToken);

    const newRefreshTokenEntity = new RefreshToken({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: existingToken.familyId, // Preserves session / family identifier
      expiresAt: this._refreshTokenService.getExpirationDate(),
    });

    // Atomically rotate old token with new token
    await this._refreshTokenRepo.rotateToken(existingToken.id, newRefreshTokenEntity);

    // Issue fresh access token
    const accessToken = this._accessTokenService.generate({
      userId: user.id,
      email: user.email.getValue(),
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        email: user.email.getValue(),
        name: user.name,
      },
    };
  }
}
