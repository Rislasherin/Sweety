import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type RefreshToken } from "@domain/entities/RefreshToken";

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly _tokens: Map<string, RefreshToken> = new Map();

  async save(token: RefreshToken): Promise<RefreshToken> {
    this._tokens.set(token.tokenHash, token);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this._tokens.get(tokenHash) ?? null;
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<void> {
    for (const token of this._tokens.values()) {
      if (token.familyId === familyId) {
        token.revoke(now);
      }
    }
  }

  async rotateToken(
    oldTokenId: string,
    newToken: RefreshToken,
    now: Date = new Date(),
  ): Promise<void> {
    for (const token of this._tokens.values()) {
      if (token.id === oldTokenId) {
        token.rotate(newToken.id, now);
      }
    }
    this._tokens.set(newToken.tokenHash, newToken);
  }

  async revokeById(id: string, now: Date = new Date()): Promise<void> {
    for (const token of this._tokens.values()) {
      if (token.id === id) {
        token.revoke(now);
      }
    }
  }
}
