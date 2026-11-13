import { type PrismaClient } from "@prisma/client";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";

export interface UserFactoryOverrides {
  userRepository?: IUserRepository;
}

export class UserFactory {
  private _userRepository: IUserRepository;

  constructor(prisma: PrismaClient, overrides: UserFactoryOverrides = {}) {
    this._userRepository = overrides.userRepository ?? new PrismaUserRepository(prisma);
  }

  getUserRepository(): IUserRepository {
    return this._userRepository;
  }
}
