import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "@main/app";
import { prisma } from "@infrastructure/database/PrismaClient";

describe("Real PostgreSQL Database Verification", () => {
  const app = createApp(); // Uses real PrismaUserRepository and BcryptService
  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const rawPassword = "StrongPassword123!";
  let createdUserId: string;

  afterAll(async () => {
    // Clean up only the specific test user created during this e2e test
    if (createdUserId) {
      await prisma.user.deleteMany({
        where: { id: createdUserId },
      });
    }
    await prisma.$disconnect();
  });

  it("0. Health check endpoint returns 200 and healthy status", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).not.toHaveProperty("DATABASE_URL");
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("1. A new user can register against real PostgreSQL", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "E2E Test User",
        email: testEmail,
        password: rawPassword,
      })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toMatchObject({
      name: "E2E Test User",
      email: testEmail.toLowerCase(),
    });
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("createdAt");

    createdUserId = response.body.data.id;
  });

  it("2. The user is actually persisted in PostgreSQL", async () => {
    const dbRecord = await prisma.user.findUnique({
      where: { email: testEmail.toLowerCase() },
    });

    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.id).toBe(createdUserId);
    expect(dbRecord?.name).toBe("E2E Test User");
    expect(dbRecord?.email).toBe(testEmail.toLowerCase());
  });

  it("3. Password is stored as a bcrypt hash, not plain text", async () => {
    const dbRecord = await prisma.user.findUnique({
      where: { email: testEmail.toLowerCase() },
    });

    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.passwordHash).not.toBe(rawPassword);
    expect(dbRecord?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);

    const isMatch = await bcrypt.compare(rawPassword, dbRecord!.passwordHash);
    expect(isMatch).toBe(true);
  });

  it("4. Duplicate registration returns HTTP 409", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another Name",
        email: testEmail,
        password: rawPassword,
      })
      .expect("Content-Type", /json/)
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "An account with this email already exists",
    });
  });

  it("5. Invalid registration returns HTTP 400", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "",
        email: "not-an-email",
        password: "short",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it("6. The returned response does not expose password or passwordHash", async () => {
    const freshEmail = `safe_response_${Date.now()}@example.com`;
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Safe Response User",
        email: freshEmail,
        password: rawPassword,
      })
      .expect(201);

    expect(response.body.data).not.toHaveProperty("password");
    expect(response.body.data).not.toHaveProperty("passwordHash");
    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.passwordHash).toBeUndefined();

    // Clean up
    await prisma.user.deleteMany({
      where: { id: response.body.data.id },
    });
  });
});
