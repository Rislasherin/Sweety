import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import { prisma } from "@infrastructure/database/PrismaClient";
import { ReportType } from "@application/dtos/report/Response/ReportResponseDTO";

describe("Real PostgreSQL Database Report Verification (E2E)", () => {
  const app = createApp();
  const timestamp = Date.now();
  const user1Email = `report_e2e_u1_${timestamp}@example.com`;
  const user2Email = `report_e2e_u2_${timestamp}@example.com`;
  const password = "Password123!";

  let user1Id: string;
  let user2Id: string;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    // 1. Register User 1
    const regRes1 = await request(app)
      .post("/api/auth/register")
      .send({ name: "Report User One", email: user1Email, password })
      .expect(201);
    user1Id = regRes1.body.data.id;

    const loginRes1 = await request(app)
      .post("/api/auth/login")
      .send({ email: user1Email, password })
      .expect(200);
    token1 = loginRes1.body.data.token;

    // 2. Register User 2
    const regRes2 = await request(app)
      .post("/api/auth/register")
      .send({ name: "Report User Two", email: user2Email, password })
      .expect(201);
    user2Id = regRes2.body.data.id;

    const loginRes2 = await request(app)
      .post("/api/auth/login")
      .send({ email: user2Email, password })
      .expect(200);
    token2 = loginRes2.body.data.token;

    // 3. Seed readings for User 1 in real PostgreSQL
    // 2026-05-10: 4 slots
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-10", slot: "AFTER_BREAKFAST", glucoseValue: 120 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-10", slot: "AFTER_LUNCH", glucoseValue: 140 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-10", slot: "AFTER_DINNER", glucoseValue: 160 });

    // 2026-05-01 (May 1st)
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-01", slot: "MORNING", glucoseValue: 90 });

    // 2026-05-15 (May 15th)
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-15", slot: "AFTER_DINNER", glucoseValue: 150 });

    // 2026-05-20 (May 20th - after the 15th)
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-05-20", slot: "MORNING", glucoseValue: 180 });

    // April readings (previous month)
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-04-01", slot: "MORNING", glucoseValue: 95 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-04-15", slot: "AFTER_LUNCH", glucoseValue: 110 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-04-30", slot: "AFTER_DINNER", glucoseValue: 145 });

    // March reading (prior to previous month)
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token1}`)
      .send({ date: "2026-03-31", slot: "AFTER_DINNER", glucoseValue: 200 });

    // 4. Seed readings for User 2 in real PostgreSQL
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token2}`)
      .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 250 });
    await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token2}`)
      .send({ date: "2026-04-15", slot: "MORNING", glucoseValue: 300 });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [user1Id, user2Id].filter(Boolean) },
      },
    });
    await prisma.$disconnect();
  });

  it("1. Generates Daily Report against real PostgreSQL with 4 slots and accurate stats", async () => {
    const response = await request(app)
      .get("/api/reports/daily?date=2026-05-10")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        reportType: ReportType.DAILY,
        startDate: "2026-05-10",
        endDate: "2026-05-10",
        highest: 160,
        lowest: 100,
        average: 130,
        count: 4,
        totalReadings: 4,
        hasData: true,
      },
    });

    expect(response.body.data.readings).toHaveLength(4);
    // User 2 reading on same date (250) must not appear
    expect(
      response.body.data.readings.every((r: { glucoseValue: number }) => r.glucoseValue !== 250),
    ).toBe(true);
  });

  it("2. Evaluates PostgreSQL aggregation for Month-to-Date Report with date range filter", async () => {
    const response = await request(app)
      .get("/api/reports/month-to-date?date=2026-05-15")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    // Included User 1 readings:
    // 2026-05-01: 90
    // 2026-05-10: 100, 120, 140, 160
    // 2026-05-15: 150
    // Values: [90, 100, 120, 140, 160, 150] -> Total = 760 / 6 = 126.666... -> 126.7
    // Excluded: 2026-05-20 (180), April readings, and User 2 reading (250)
    expect(response.body).toMatchObject({
      success: true,
      data: {
        reportType: ReportType.MONTH_TO_DATE,
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        highest: 160,
        lowest: 90,
        average: 126.7,
        count: 6,
        totalReadings: 6,
        hasData: true,
      },
    });
  });

  it("3. Evaluates PostgreSQL aggregation for Previous Full Month Report", async () => {
    const response = await request(app)
      .get("/api/reports/previous-month?date=2026-05-15")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    // Included User 1 readings in April (2026-04-01 to 2026-04-30):
    // 2026-04-01: 95
    // 2026-04-15: 110
    // 2026-04-30: 145
    // Values: [95, 110, 145] -> Total = 350 / 3 = 116.666... -> 116.7
    // Excluded: March 31 (200), May readings, User 2 reading (300)
    expect(response.body).toMatchObject({
      success: true,
      data: {
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        highest: 145,
        lowest: 95,
        average: 116.7,
        count: 3,
        totalReadings: 3,
        hasData: true,
      },
    });
  });

  it("4. Returns friendly empty state from real PostgreSQL when user has no readings in range", async () => {
    // User 2 has no readings in March 2026
    const response = await request(app)
      .get("/api/reports/previous-month?date=2026-04-10")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
      },
    });
  });

  it("5. Strict user isolation in real PostgreSQL: User 2 sees only User 2 data", async () => {
    const response = await request(app)
      .get("/api/reports/daily?date=2026-05-10")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    // User 2 has only 1 reading (250) on 2026-05-10
    expect(response.body.data).toMatchObject({
      reportType: ReportType.DAILY,
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      highest: 250,
      lowest: 250,
      average: 250,
      count: 1,
      hasData: true,
    });
    expect(response.body.data.readings).toHaveLength(1);
    expect(response.body.data.readings[0].glucoseValue).toBe(250);
  });
});
