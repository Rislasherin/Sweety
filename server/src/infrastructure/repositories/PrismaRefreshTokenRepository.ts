import { type PrismaClient } from "@prisma/client";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type RefreshToken } from "@domain/entities/RefreshToken";
import { PrismaRefreshTokenMapper } from "@infrastructure/mappers/PrismaRefreshTokenMapper";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: RefreshToken): Promise<RefreshToken> {
    const data = PrismaRefreshTokenMapper.toPersistence(token);
    const saved = await this.prisma.refreshToken.create({
      data,
    });
    return PrismaRefreshTokenMapper.toDomain(saved);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return record ? PrismaRefreshTokenMapper.toDomain(record) : null;
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: now,
      },
    });
  }

  async rotateToken(
    oldTokenId: string,
    newToken: RefreshToken,
    now: Date = new Date(),
  ): Promise<void> {
    const newPersistenceData = PrismaRefreshTokenMapper.toPersistence(newToken);

    await this.prisma.$transaction(async (tx) => {
      // 1. Mark previous token as revoked and replaced
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: {
          isRevoked: true,
          revokedAt: now,
          replacedBy: newToken.id,
        },
      });

      // 2. Insert new token
      await tx.refreshToken.create({
        data: newPersistenceData,
      });
    });
  }

  async revokeById(id: string, now: Date = new Date()): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: now,
      },
    });
  }
}
