import { describe, it, expect, vi } from "vitest";
import { type PrismaClient } from "@prisma/client";
import { Container } from "@infrastructure/di/Container";
import { UserFactory } from "@infrastructure/di/factories/UserFactory";
import { AuthFactory } from "@infrastructure/di/factories/AuthFactory";
import { ReadingFactory } from "@infrastructure/di/factories/ReadingFactory";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { createApp } from "@main/app";

describe("Dependency Injection & Infrastructure Factories", () => {
  const mockPrisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    reading: { findMany: vi.fn(), create: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaClient;

  it("1. UserFactory constructs and exposes IUserRepository", () => {
    const factory = new UserFactory(mockPrisma);
    const repo = factory.getUserRepository();

    expect(repo).toBeDefined();
    expect(typeof repo.findByEmail).toBe("function");
    expect(typeof repo.save).toBe("function");
  });

  it("2. AuthFactory constructs auth use cases, controller, and middleware", () => {
    const mockUserRepo: IUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    };

    const factory = new AuthFactory(mockPrisma, mockUserRepo);

    expect(factory.getUserRepository()).toBe(mockUserRepo);
    expect(factory.getRefreshTokenRepository()).toBeDefined();
    expect(factory.getPasswordService()).toBeDefined();
    expect(factory.getAccessTokenService()).toBeDefined();
    expect(factory.getRefreshTokenService()).toBeDefined();
    expect(factory.getRegisterUserUseCase()).toBeDefined();
    expect(factory.getLoginUserUseCase()).toBeDefined();
    expect(factory.getRefreshTokenUseCase()).toBeDefined();
    expect(factory.getLogoutUseCase()).toBeDefined();
    expect(factory.getAuthController()).toBeDefined();
    expect(typeof factory.getAuthMiddleware()).toBe("function");
  });

  it("3. ReadingFactory constructs reading and report controllers", () => {
    const factory = new ReadingFactory(mockPrisma);

    expect(factory.getReadingRepository()).toBeDefined();
    expect(factory.getReadingController()).toBeDefined();
    expect(factory.getReportController()).toBeDefined();
  });

  it("4. Container composes factories and exposes root route handlers", () => {
    const container = new Container({ prisma: mockPrisma });

    expect(container.userFactory).toBeInstanceOf(UserFactory);
    expect(container.authFactory).toBeInstanceOf(AuthFactory);
    expect(container.readingFactory).toBeInstanceOf(ReadingFactory);
    expect(container.authController).toBeDefined();
    expect(container.readingController).toBeDefined();
    expect(container.reportController).toBeDefined();
    expect(typeof container.authMiddleware).toBe("function");
  });

  it("5. createApp accepts container injection without constructing dependencies internally", () => {
    const container = new Container({ prisma: mockPrisma });
    const app = createApp({ container });

    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });

  it("6. Container singleton manages a single global instance", () => {
    Container.resetInstance();
    const inst1 = Container.getInstance();
    const inst2 = Container.getInstance();

    expect(inst1).toBe(inst2);
  });
});
