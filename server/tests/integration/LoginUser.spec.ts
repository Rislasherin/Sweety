import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";
import { BcryptService } from "@infrastructure/services/BcryptService";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";
import { randomUUID } from "node:crypto";

/**
 * HTTP Integration Tests for User Login & JWT Authentication
 *
 * Exercises Express HTTP pipeline, validation middleware, AuthController,
 * LoginUserUseCase, and createAuthMiddleware using an in-memory repository.
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
}

describe("POST /api/auth/login & JWT Authentication (HTTP Integration)", () => {
  let memoryUserRepository: InMemoryUserRepository;
  let bcryptService: BcryptService;
  let tokenService: JwtTokenService;
  let app: ReturnType<typeof createApp>;

  const rawPassword = "CorrectPassword123!";
  const testEmail = "testuser@example.com";

  beforeEach(async () => {
    memoryUserRepository = new InMemoryUserRepository();
    bcryptService = new BcryptService();
    tokenService = new JwtTokenService({
      secret: "integration-test-secret-key-1234567890",
      expiresIn: "1h",
    });

    // Seed test user with hashed password
    const passwordHash = await bcryptService.hash(rawPassword);
    await memoryUserRepository.save(
      User.create({
        id: "test-user-id-123",
        name: "Test User",
        email: Email.create(testEmail),
        passwordHash,
      }),
    );

    app = createApp({
      userRepository: memoryUserRepository,
      passwordService: bcryptService,
      tokenService,
    });
  });

  it("1. Successful login returns 200 with JWT token and safe user details", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: rawPassword,
      })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toMatchObject({
      id: "test-user-id-123",
      name: "Test User",
      email: testEmail,
    });
    expect(response.body.data).toHaveProperty("token");
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.token.split(".").length).toBe(3);
    expect(response.body.data).not.toHaveProperty("password");
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("2. Invalid credentials (wrong password) returns 401 Unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "IncorrectPassword123!",
      })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("3. Invalid credentials (non-existent email) returns generic 401 Unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: rawPassword,
      })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("4. Missing fields return 400 Bad Request with validation errors", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("5. Invalid email format returns 400 Bad Request", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: rawPassword,
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    const emailError = response.body.errors.find((err: { field: string }) => err.field === "email");
    expect(emailError).toBeDefined();
  });

  it("6. Missing Authorization header on protected route returns 401", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });

  it("7. Invalid token on protected route returns 401", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.fake.token")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired token",
    });
  });

  it("8. Expired token on protected route returns 401", async () => {
    const expiredService = new JwtTokenService({
      secret: "integration-test-secret-key-1234567890",
      expiresIn: "1ms",
    });

    const expiredToken = expiredService.generate({
      userId: "test-user-id-123",
      email: testEmail,
    });

    // Short wait to ensure expiration
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired token",
    });
  });

  it("9. Valid token authentication allows access and returns authenticated user", async () => {
    // 1. Login to obtain token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: rawPassword,
      })
      .expect(200);

    const token = loginRes.body.data.token;

    // 2. Access protected endpoint using Bearer token
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(meRes.body).toHaveProperty("success", true);
    expect(meRes.body.data).toEqual({
      id: "test-user-id-123",
      email: testEmail,
    });
  });
});
