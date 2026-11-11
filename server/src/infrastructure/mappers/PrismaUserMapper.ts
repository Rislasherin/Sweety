import type { User as PrismaUser, Prisma } from "@prisma/client";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create({
      id: raw.id,
      name: raw.name,
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      name: user.name,
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
