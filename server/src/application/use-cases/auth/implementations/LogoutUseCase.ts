import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { type ILogoutUseCase, type LogoutRequest } from "../interfaces/ILogoutUseCase";

export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    private readonly _refreshTokenRepo: IRefreshTokenRepository,
    private readonly _refreshTokenService: IRefreshTokenService,
  ) {}

  async execute(request: LogoutRequest): Promise<void> {
    const rawToken = request.refreshToken?.trim();
    if (!rawToken) {
      return;
    }

    try {
      const tokenHash = this._refreshTokenService.hashToken(rawToken);
      const token = await this._refreshTokenRepo.findByTokenHash(tokenHash);

      if (token) {
        // Revoke the session/family associated with this refresh token
        await this._refreshTokenRepo.revokeFamily(token.familyId);
      }
    } catch {
      // Logout is fail-safe and idempotent
    }
  }
}
