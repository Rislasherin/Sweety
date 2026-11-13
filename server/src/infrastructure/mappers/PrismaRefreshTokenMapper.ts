import { type RefreshToken as PrismaRefreshTokenModel } from "@prisma/client";
import { RefreshToken } from "@domain/entities/RefreshToken";

export class PrismaRefreshTokenMapper {
  static toDomain(model: PrismaRefreshTokenModel): RefreshToken {
    return new RefreshToken({
      id: model.id,
      userId: model.userId,
      tokenHash: model.tokenHash,
      familyId: model.familyId,
      expiresAt: model.expiresAt,
      isRevoked: model.isRevoked,
      revokedAt: model.revokedAt,
      replacedBy: model.replacedBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: RefreshToken): {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt: Date | null;
    replacedBy: string | null;
  } {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      familyId: entity.familyId,
      expiresAt: entity.expiresAt,
      isRevoked: entity.isRevoked,
      revokedAt: entity.revokedAt,
      replacedBy: entity.replacedBy,
    };
  }
}
