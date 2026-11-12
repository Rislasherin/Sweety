import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "@main/app";
import { ReportType } from "@application/dtos/report/Response/ReportResponseDTO";
import { getDaysInMonth, formatUtcYmd } from "../../prisma/seed";

describe("Demo Data Reports & Analytics API E2E Verification", () => {
  const app = createApp();
  const prisma = new PrismaClient();
  const demoEmail = (process.env.DEMO_USER_EMAIL || "demo@sweety.app").toLowerCase();
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  let demoToken: string;
  let targetDateStr: string;
  let emptyDateStr: string;

  let expectedDaily: {
    count: number;
    lowest: number;
    highest: number;
    average: number;
    slots: string[];
  };

  let expectedMtd: {
    startDate: string;
    endDate: string;
    count: number;
    lowest: number;
    highest: number;
    average: number;
  };

  let expectedPrevMonth: {
    startDate: string;
    endDate: string;
    count: number;
    lowest: number;
    highest: number;
    average: number;
  };

  beforeAll(async () => {
    if (!demoPassword) {
      throw new Error(
        "DEMO_USER_PASSWORD environment variable is required for DemoDataReportsApi test.",
      );
    }

    // 1. Authenticate with the seeded demo user credentials
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: demoEmail, password: demoPassword })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.email).toBe(demoEmail);
    demoToken = loginRes.body.data.token;
    expect(demoToken).toBeTruthy();

    // 2. Query seeded demo user readings from database to derive calendar-independent test targets
    const demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: {
        readings: {
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!demoUser || demoUser.readings.length === 0) {
      throw new Error("No seeded demo user or readings found. Please run seed script first.");
    }

    // Find the latest seeded date (corresponds to reference date/today in seed)
    const latestReading = demoUser.readings[demoUser.readings.length - 1];
    targetDateStr = latestReading.date.toISOString().split("T")[0];
    const [targetYear, targetMonth] = targetDateStr.split("-").map(Number);

    // Derive Daily Report expectations for targetDateStr
    const dailyReadings = demoUser.readings.filter(
      (r) => r.date.toISOString().split("T")[0] === targetDateStr,
    );
    expect(dailyReadings.length).toBeGreaterThan(0);

    const dailyValues = dailyReadings.map((r) => r.glucoseValue);
    const dailySum = dailyValues.reduce((sum, val) => sum + val, 0);
    expectedDaily = {
      count: dailyReadings.length,
      lowest: Math.min(...dailyValues),
      highest: Math.max(...dailyValues),
      average: Number((dailySum / dailyReadings.length).toFixed(1)),
      slots: dailyReadings.map((r) => r.slot),
    };

    // Derive Month-to-Date Report expectations
    const mtdStart = formatUtcYmd(targetYear, targetMonth, 1);
    const mtdEnd = targetDateStr;
    const mtdReadings = demoUser.readings.filter((r) => {
      const d = r.date.toISOString().split("T")[0];
      return d >= mtdStart && d <= mtdEnd;
    });
    expect(mtdReadings.length).toBeGreaterThan(0);

    const mtdValues = mtdReadings.map((r) => r.glucoseValue);
    const mtdSum = mtdValues.reduce((sum, val) => sum + val, 0);
    expectedMtd = {
      startDate: mtdStart,
      endDate: mtdEnd,
      count: mtdReadings.length,
      lowest: Math.min(...mtdValues),
      highest: Math.max(...mtdValues),
      average: Number((mtdSum / mtdReadings.length).toFixed(1)),
    };

    // Derive Previous-Month Report expectations (with dynamic year/month rollover)
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);
    const prevStart = formatUtcYmd(prevYear, prevMonth, 1);
    const prevEnd = formatUtcYmd(prevYear, prevMonth, daysInPrev);

    const prevReadings = demoUser.readings.filter((r) => {
      const d = r.date.toISOString().split("T")[0];
      return d >= prevStart && d <= prevEnd;
    });
    expect(prevReadings.length).toBeGreaterThan(0);

    const prevValues = prevReadings.map((r) => r.glucoseValue);
    const prevSum = prevValues.reduce((sum, val) => sum + val, 0);
    expectedPrevMonth = {
      startDate: prevStart,
      endDate: prevEnd,
      count: prevReadings.length,
      lowest: Math.min(...prevValues),
      highest: Math.max(...prevValues),
      average: Number((prevSum / prevReadings.length).toFixed(1)),
    };

    // Derive an unseeded date in current month (or adjacent) for empty daily report testing
    const seededDaysInTargetMonth = new Set(
      demoUser.readings
        .map((r) => r.date.toISOString().split("T")[0])
        .filter((d) =>
          d.startsWith(
            `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}`,
          ),
        )
        .map((d) => Number(d.split("-")[2])),
    );

    let emptyCandidate = 1;
    const daysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
    while (emptyCandidate <= daysInTargetMonth && seededDaysInTargetMonth.has(emptyCandidate)) {
      emptyCandidate++;
    }

    if (emptyCandidate <= daysInTargetMonth) {
      emptyDateStr = formatUtcYmd(targetYear, targetMonth, emptyCandidate);
    } else {
      emptyDateStr = formatUtcYmd(targetYear - 1, 1, 1);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. GET /api/reports/daily returns all meal slots and exact statistics for seeded target date", async () => {
    const res = await request(app)
      .get(`/api/reports/daily?date=${targetDateStr}`)
      .set("Authorization", `Bearer ${demoToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.reportType).toBe(ReportType.DAILY);
    expect(data.hasData).toBe(true);
    expect(data.startDate).toBe(targetDateStr);
    expect(data.endDate).toBe(targetDateStr);
    expect(data.count).toBe(expectedDaily.count);
    expect(data.lowest).toBe(expectedDaily.lowest);
    expect(data.highest).toBe(expectedDaily.highest);
    expect(data.average).toBe(expectedDaily.average);
    expect(data.readings).toHaveLength(expectedDaily.count);

    const returnedSlots = data.readings.map((r: { slot: string }) => r.slot);
    expect(returnedSlots).toEqual(expectedDaily.slots);
  });

  it("2. GET /api/reports/month-to-date returns aggregated statistics spanning from month start to target date", async () => {
    const res = await request(app)
      .get(`/api/reports/month-to-date?date=${targetDateStr}`)
      .set("Authorization", `Bearer ${demoToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.reportType).toBe(ReportType.MONTH_TO_DATE);
    expect(data.hasData).toBe(true);
    expect(data.startDate).toBe(expectedMtd.startDate);
    expect(data.endDate).toBe(expectedMtd.endDate);
    expect(data.count).toBe(expectedMtd.count);
    expect(data.lowest).toBe(expectedMtd.lowest);
    expect(data.highest).toBe(expectedMtd.highest);
    expect(data.average).toBe(expectedMtd.average);
    expect(data.readings).toBeUndefined(); // Aggregated report only
  });

  it("3. GET /api/reports/previous-month returns aggregated statistics spanning full previous calendar month", async () => {
    const res = await request(app)
      .get(`/api/reports/previous-month?date=${targetDateStr}`)
      .set("Authorization", `Bearer ${demoToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.reportType).toBe(ReportType.PREVIOUS_MONTH);
    expect(data.hasData).toBe(true);
    expect(data.startDate).toBe(expectedPrevMonth.startDate);
    expect(data.endDate).toBe(expectedPrevMonth.endDate);
    expect(data.count).toBe(expectedPrevMonth.count);
    expect(data.lowest).toBe(expectedPrevMonth.lowest);
    expect(data.highest).toBe(expectedPrevMonth.highest);
    expect(data.average).toBe(expectedPrevMonth.average);
    expect(data.readings).toBeUndefined(); // Aggregated report only
  });

  it("4. GET /api/reports/daily returns empty report contract for unseeded calendar date", async () => {
    const res = await request(app)
      .get(`/api/reports/daily?date=${emptyDateStr}`)
      .set("Authorization", `Bearer ${demoToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.reportType).toBe(ReportType.DAILY);
    expect(data.hasData).toBe(false);
    expect(data.startDate).toBe(emptyDateStr);
    expect(data.endDate).toBe(emptyDateStr);
    expect(data.count).toBe(0);
    expect(data.lowest).toBeNull();
    expect(data.highest).toBeNull();
    expect(data.average).toBeNull();
    expect(data.readings).toEqual([]);
  });
});
