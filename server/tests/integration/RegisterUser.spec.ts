import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { type Email } from "@domain/value-objects/Email";
import { BcryptService } from "@infrastructure/services/BcryptService";
import { randomUUID } from "node:crypto";

/**
 * HTTP Integration Tests for User Registration API
 *
 * Verifies Express pipeline (Helmet, CORS, body-parser, validateDto middleware,
 * AuthController, RegisterUserUseCase, and error middleware) end-to-end.
 * Uses an in-memory repository to test HTTP layer behavior independently of a running database.
 */
class InMemoryUserRepository implements IUserRepository {
  private readonly users: Map<string, User> = new Map();

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    const saved = User.create({
      id: user.id || randomUUID(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    this.users.set(saved.email.getValue(), saved);
    return saved;
  }

  getUserByEmail(emailString: string): User | undefined {
    return this.users.get(emailString.trim().toLowerCase());
  }

  clear(): void {
    this.users.clear();
  }
}

describe("POST /api/auth/register (HTTP Presentation & Pipeline)", () => {
  let memoryUserRepository: InMemoryUserRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    memoryUserRepository = new InMemoryUserRepository();
    const bcryptService = new BcryptService();

    app = createApp({
      userRepository: memoryUserRepository,
      passwordService: bcryptService,
    });
  });

  const validPayload = {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    password: "Password123!",
  };

  it("1. Successful registration returns 201 with sanitized response", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(validPayload)
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toMatchObject({
      name: "Jane Doe",
      email: "jane.doe@example.com",
    });
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("createdAt");
    expect(response.body.data).not.toHaveProperty("password");
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("2. Duplicate email returns 409 Conflict", async () => {
    await request(app).post("/api/auth/register").send(validPayload).expect(201);

    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send(validPayload)
      .expect(409);

    expect(duplicateResponse.body).toMatchObject({
      success: false,
      message: "An account with this email already exists",
    });
  });

  it("3. Invalid email format returns 400 Bad Request with field error", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validPayload,
        email: "not-an-email",
      })
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("errors");
    const emailError = response.body.errors.find((err: { field: string }) => err.field === "email");
    expect(emailError).toBeDefined();
  });

  it("4. Missing required fields return 400 Bad Request with validation errors", async () => {
    const response = await request(app).post("/api/auth/register").send({}).expect(400);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("5. Password shorter than minimum length returns 400 Bad Request", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validPayload,
        password: "short",
      })
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    const passwordError = response.body.errors.find(
      (err: { field: string }) => err.field === "password",
    );
    expect(passwordError).toBeDefined();
    expect(passwordError.message).toContain("8 characters");
  });

  it("6. Password is stored as a secure bcrypt hash, not plain text", async () => {
    const plainPassword = "VerySecurePassword123!";
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Security Tester",
        email: "security@example.com",
        password: plainPassword,
      })
      .expect(201);

    const storedUser = memoryUserRepository.getUserByEmail("security@example.com");
    expect(storedUser).toBeDefined();
    expect(storedUser!.passwordHash).not.toBe(plainPassword);
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    expect(storedUser!.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it("7. Unknown routes return consistent JSON 404 response", async () => {
    const response = await request(app)
      .get("/api/non-existent-route")
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: "Route not found",
    });
  });
});
