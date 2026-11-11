import { Prisma, type PrismaClient } from "@prisma/client";

import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { UserAlreadyExistsError } from "@application/errors/UserAlreadyExistsError";
import { type User } from "@domain/entities/User";
import { type Email } from "@domain/value-objects/Email";
import { PrismaUserMapper } from "@infrastructure/mappers/PrismaUserMapper";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.getValue(),
      },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    try {
      const savedUser = await this.prisma.user.create({
        data: PrismaUserMapper.toPersistence(user),
      });

      return PrismaUserMapper.toDomain(savedUser);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new UserAlreadyExistsError();
      }

      throw error;
    }
  }
}
