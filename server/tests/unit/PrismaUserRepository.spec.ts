import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";
import { UserAlreadyExistsError } from "@application/errors/UserAlreadyExistsError";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";

describe("PrismaUserRepository Unit Tests", () => {
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let repository: PrismaUserRepository;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    repository = new PrismaUserRepository(mockPrisma as unknown as PrismaClient);
  });

  const testUser = User.create({
    id: "test-uuid-1",
    name: "John Doe",
    email: Email.create("john@example.com"),
    passwordHash: "hashed_pwd",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });

  it("findByEmail returns Domain User when record exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "test-uuid-1",
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed_pwd",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const user = await repository.findByEmail(Email.create("john@example.com"));

    expect(user).not.toBeNull();
    expect(user!.id).toBe("test-uuid-1");
    expect(user!.email.getValue()).toBe("john@example.com");
  });

  it("findByEmail returns null when record is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const user = await repository.findByEmail(Email.create("nonexistent@example.com"));

    expect(user).toBeNull();
  });

  it("save successfully persists and returns mapped Domain User", async () => {
    mockPrisma.user.create.mockResolvedValue({
      id: testUser.id,
      name: testUser.name,
      email: testUser.email.getValue(),
      passwordHash: testUser.passwordHash,
      createdAt: testUser.createdAt,
      updatedAt: testUser.updatedAt,
    });

    const saved = await repository.save(testUser);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: testUser.id,
        name: testUser.name,
        email: "john@example.com",
        passwordHash: "hashed_pwd",
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      },
    });
    expect(saved.id).toBe(testUser.id);
  });

  it("save translates Prisma P2002 error to UserAlreadyExistsError", async () => {
    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`email`)",
      {
        code: "P2002",
        clientVersion: "6.19.3",
      },
    );
    mockPrisma.user.create.mockRejectedValue(p2002Error);

    await expect(repository.save(testUser)).rejects.toThrow(UserAlreadyExistsError);
  });

  it("save rethrows unexpected Prisma database errors", async () => {
    const connectionError = new Error("Connection timed out");
    mockPrisma.user.create.mockRejectedValue(connectionError);

    await expect(repository.save(testUser)).rejects.toThrow("Connection timed out");
  });
});
