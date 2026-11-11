import { type RefreshToken } from "@domain/entities/RefreshToken";

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeFamily(familyId: string, now?: Date): Promise<void>;
  rotateToken(oldTokenId: string, newToken: RefreshToken, now?: Date): Promise<void>;
  revokeById(id: string, now?: Date): Promise<void>;
}
