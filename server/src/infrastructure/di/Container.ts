import { type PrismaClient } from "@prisma/client";
import { type RequestHandler } from "express";
import { prisma as defaultPrisma } from "@infrastructure/database/PrismaClient";
import { UserFactory, type UserFactoryOverrides } from "./factories/UserFactory";
import { AuthFactory, type AuthFactoryOverrides } from "./factories/AuthFactory";
import { ReadingFactory, type ReadingFactoryOverrides } from "./factories/ReadingFactory";
import { type AuthController } from "@presentation/controllers/AuthController";
import { type ReadingController } from "@presentation/controllers/ReadingController";
import { type ReportController } from "@presentation/controllers/ReportController";

export interface ContainerOverrides {
  prisma?: PrismaClient;
  userFactory?: UserFactoryOverrides;
  authFactory?: AuthFactoryOverrides;
  readingFactory?: ReadingFactoryOverrides;
}

export class Container {
  private static _instance: Container | null = null;

  private readonly _prisma: PrismaClient;
  private readonly _userFactory: UserFactory;
  private readonly _authFactory: AuthFactory;
  private readonly _readingFactory: ReadingFactory;

  constructor(overrides: ContainerOverrides = {}) {
    this._prisma = overrides.prisma ?? defaultPrisma;

    this._userFactory = new UserFactory(this._prisma, overrides.userFactory);

    this._authFactory = new AuthFactory(
      this._prisma,
      this._userFactory.getUserRepository(),
      overrides.authFactory,
    );

    this._readingFactory = new ReadingFactory(this._prisma, overrides.readingFactory);
  }

  static getInstance(): Container {
    if (!Container._instance) {
      Container._instance = new Container();
    }
    return Container._instance;
  }

  static resetInstance(): void {
    Container._instance = null;
  }

  get userFactory(): UserFactory {
    return this._userFactory;
  }

  get authFactory(): AuthFactory {
    return this._authFactory;
  }

  get readingFactory(): ReadingFactory {
    return this._readingFactory;
  }

  get authController(): AuthController {
    return this._authFactory.getAuthController();
  }

  get authMiddleware(): RequestHandler {
    return this._authFactory.getAuthMiddleware();
  }

  get readingController(): ReadingController {
    return this._readingFactory.getReadingController();
  }

  get reportController(): ReportController {
    return this._readingFactory.getReportController();
  }
}
