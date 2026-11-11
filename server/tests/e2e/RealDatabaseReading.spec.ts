import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import { prisma } from "@infrastructure/database/PrismaClient";

describe("Real PostgreSQL Database Reading Verification (E2E)", () => {
  const app = createApp();
  const timestamp = Date.now();
  const user1Email = `reading_e2e_u1_${timestamp}@example.com`;
  const user2Email = `reading_e2e_u2_${timestamp}@example.com`;
  const password = "Password123!";

  let user1Id: string;
  let user2Id: string;
  let token1: string;
  let token2: string;
  let createdReadingId: string;

  beforeAll(async () => {
    // 1. Register User 1
    const regRes1 = await request(app)
      .post("/api/auth/register")
      .send({ name: "User One", email: user1Email, password })
      .expect(201);
    user1Id = regRes1.body.data.id;

    // Login User 1 to get JWT
    const loginRes1 = await request(app)
      .post("/api/auth/login")
      .send({ email: user1Email, password })
      .expect(200);
    token1 = loginRes1.body.data.token;

    // 2. Register User 2
    const regRes2 = await request(app)
      .post("/api/auth/register")
      .send({ name: "User Two", email: user2Email, password })
      .expect(201);
    user2Id = regRes2.body.data.id;

    // Login User 2 to get JWT
    const loginRes2 = await request(app)
      .post("/api/auth/login")
      .send({ email: user2Email, password })
      .expect(200);
    token2 = loginRes2.body.data.token;
  });

  afterAll(async () => {
    // Clean up test users (and cascade delete any remaining readings)
    await prisma.user.deleteMany({
      where: {
        id: { in: [user1Id, user2Id].filter(Boolean) },
      },
    });
    await prisma.$disconnect();
  });

  it("1. Creates a glucose reading in real PostgreSQL", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        date: "2026-05-10",
        slot: "MORNING",
        glucoseValue: 108,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        userId: user1Id,
        date: "2026-05-10",
        slot: "MORNING",
        glucoseValue: 108,
      },
    });
    expect(response.body.data).toHaveProperty("id");
    createdReadingId = response.body.data.id;

    // Verify record in PostgreSQL directly via Prisma
    const dbReading = await prisma.reading.findUnique({
      where: { id: createdReadingId },
    });

    expect(dbReading).not.toBeNull();
    expect(dbReading?.userId).toBe(user1Id);
    expect(dbReading?.slot).toBe("MORNING");
    expect(dbReading?.glucoseValue).toBe(108);
  });

  it("2. Real PostgreSQL unique constraint (userId, date, slot) prevents duplicates for same user", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        date: "2026-05-10",
        slot: "MORNING",
        glucoseValue: 120,
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "A reading for this slot already exists on this date",
    });
  });

  it("3. Different user can record reading with identical date and slot without collision", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        date: "2026-05-10",
        slot: "MORNING",
        glucoseValue: 98,
      })
      .expect(201);

    expect(response.body.data.userId).toBe(user2Id);
    expect(response.body.data.slot).toBe("MORNING");
    expect(response.body.data.glucoseValue).toBe(98);
  });

  it("4. Queries only return authenticated user's readings from PostgreSQL", async () => {
    const response = await request(app)
      .get("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(createdReadingId);
    expect(response.body.data[0].userId).toBe(user1Id);
  });

  it("5. Cross-user reading access by ID returns 404 (User Isolation)", async () => {
    // User 2 attempts to fetch User 1's reading
    const response = await request(app)
      .get(`/api/readings/${createdReadingId}`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Reading not found",
    });
  });

  it("6. Updates reading in real PostgreSQL", async () => {
    const response = await request(app)
      .patch(`/api/readings/${createdReadingId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ glucoseValue: 115 })
      .expect(200);

    expect(response.body.data.glucoseValue).toBe(115);

    // Verify in database
    const dbReading = await prisma.reading.findUnique({
      where: { id: createdReadingId },
    });
    expect(dbReading?.glucoseValue).toBe(115);
  });

  it("7. Deletes reading from real PostgreSQL", async () => {
    await request(app)
      .delete(`/api/readings/${createdReadingId}`)
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    // Verify deleted in database
    const dbReading = await prisma.reading.findUnique({
      where: { id: createdReadingId },
    });
    expect(dbReading).toBeNull();
  });

  it("8. Cascade deletion: deleting user deletes all associated readings", async () => {
    // Create reading for user 2
    const res = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        date: "2026-05-11",
        slot: "AFTER_DINNER",
        glucoseValue: 140,
      })
      .expect(201);

    const readingId = res.body.data.id;

    // Delete user 2 from PostgreSQL
    await prisma.user.delete({
      where: { id: user2Id },
    });

    // Check that reading was cascade deleted
    const dbReading = await prisma.reading.findUnique({
      where: { id: readingId },
    });
    expect(dbReading).toBeNull();
  });
});
