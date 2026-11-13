import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "@main/app";
import {
  type IReadingRepository,
  type GlucoseStatistics,
  type PaginatedReadingsResult,
  type ReadingPaginationOptions,
} from "@domain/repositories/IReadingRepository";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type Reading } from "@domain/entities/Reading";
import { type User } from "@domain/entities/User";
import { type Email } from "@domain/value-objects/Email";
import { type ReadingSlotType, READING_SLOT_ORDER } from "@domain/enums/ReadingSlotType";
import { DuplicateReadingSlotError } from "@domain/errors/ReadingErrors";
import { formatDateOnly, roundToOneDecimal } from "@domain/utils/dateUtils";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";
import { ReportType } from "@application/dtos/report/Response/ReportResponseDTO";

class InMemoryReadingRepository implements IReadingRepository {
  public readonly readings: Map<string, Reading> = new Map();

  async save(reading: Reading): Promise<Reading> {
    const dateStr = formatDateOnly(reading.date);
    for (const existing of this.readings.values()) {
      if (
        existing.userId === reading.userId &&
        formatDateOnly(existing.date) === dateStr &&
        existing.slot === reading.slot
      ) {
        throw new DuplicateReadingSlotError();
      }
    }

    this.readings.set(reading.id, reading);
    return reading;
  }

  async findById(id: string, userId: string): Promise<Reading | null> {
    const reading = this.readings.get(id);
    if (!reading || reading.userId !== userId) {
      return null;
    }
    return reading;
  }

  async findByUserId(userId: string, date?: Date): Promise<Reading[]> {
    const filterDateStr = date ? formatDateOnly(date) : null;
    const list: Reading[] = [];

    for (const reading of this.readings.values()) {
      if (reading.userId !== userId) continue;
      if (filterDateStr && formatDateOnly(reading.date) !== filterDateStr) continue;
      list.push(reading);
    }

    return list.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return READING_SLOT_ORDER[a.slot] - READING_SLOT_ORDER[b.slot];
    });
  }

  async findPaginatedByUserId(
    userId: string,
    options: ReadingPaginationOptions,
  ): Promise<PaginatedReadingsResult> {
    const all = await this.findByUserId(userId, options.date);
    const total = all.length;
    const skip = Math.max(0, (options.page - 1) * options.limit);
    const readings = all.slice(skip, skip + options.limit);
    return { readings, total };
  }

  async findByUserIdDateAndSlot(
    userId: string,
    date: Date,
    slot: ReadingSlotType,
  ): Promise<Reading | null> {
    const dateStr = formatDateOnly(date);
    for (const reading of this.readings.values()) {
      if (
        reading.userId === userId &&
        formatDateOnly(reading.date) === dateStr &&
        reading.slot === slot
      ) {
        return reading;
      }
    }
    return null;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Reading[]> {
    const startStr = formatDateOnly(startDate);
    const endStr = formatDateOnly(endDate);
    const list: Reading[] = [];

    for (const reading of this.readings.values()) {
      if (reading.userId !== userId) continue;
      const rDateStr = formatDateOnly(reading.date);
      if (rDateStr >= startStr && rDateStr <= endStr) {
        list.push(reading);
      }
    }

    return list.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return READING_SLOT_ORDER[a.slot] - READING_SLOT_ORDER[b.slot];
    });
  }

  async countByUserIdAndDate(userId: string, date: Date): Promise<number> {
    const dateStr = formatDateOnly(date);
    let count = 0;
    for (const reading of this.readings.values()) {
      if (reading.userId === userId && formatDateOnly(reading.date) === dateStr) {
        count++;
      }
    }
    return count;
  }

  async getAggregatedStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GlucoseStatistics> {
    const startStr = formatDateOnly(startDate);
    const endStr = formatDateOnly(endDate);

    const values: number[] = [];
    for (const reading of this.readings.values()) {
      if (reading.userId !== userId) continue;
      const rDateStr = formatDateOnly(reading.date);
      if (rDateStr >= startStr && rDateStr <= endStr) {
        values.push(reading.value.getValue());
      }
    }

    if (values.length === 0) {
      return {
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      };
    }

    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = roundToOneDecimal(sum / values.length);

    return {
      highest,
      lowest,
      average,
      count: values.length,
    };
  }

  async update(reading: Reading): Promise<Reading> {
    this.readings.set(reading.id, reading);
    return reading;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const reading = this.readings.get(id);
    if (!reading || reading.userId !== userId) {
      return false;
    }
    return this.readings.delete(id);
  }
}

class InMemoryUserRepository implements IUserRepository {
  private readonly users: Map<string, User> = new Map();

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }
}

describe("Reports API (HTTP Integration)", () => {
  let readingRepo: InMemoryReadingRepository;
  let userRepo: InMemoryUserRepository;
  let tokenService: JwtTokenService;
  let app: ReturnType<typeof createApp>;

  const user1Id = "user-report-1111";
  const user2Id = "user-report-2222";
  let token1: string;
  let token2: string;

  beforeEach(() => {
    readingRepo = new InMemoryReadingRepository();
    userRepo = new InMemoryUserRepository();
    tokenService = new JwtTokenService({
      secret: "reports-integration-secret-test-32bytes",
      expiresIn: "1h",
    });

    app = createApp({
      readingRepository: readingRepo,
      userRepository: userRepo,
      tokenService,
    });

    token1 = tokenService.generate({
      userId: user1Id,
      email: "user1@example.com",
    });

    token2 = tokenService.generate({
      userId: user2Id,
      email: "user2@example.com",
    });
  });

  describe("Authentication Guards", () => {
    it("rejects unauthenticated requests to all report endpoints with HTTP 401", async () => {
      await request(app).get("/api/reports/daily?date=2026-05-10").expect(401);
      await request(app).get("/api/reports/month-to-date?date=2026-05-10").expect(401);
      await request(app).get("/api/reports/previous-month?date=2026-05-10").expect(401);
    });

    it("rejects invalid Bearer tokens with HTTP 401", async () => {
      await request(app)
        .get("/api/reports/daily?date=2026-05-10")
        .set("Authorization", "Bearer invalid.jwt.token")
        .expect(401);
    });
  });

  describe("Validation & Security", () => {
    it("rejects missing date query parameter with HTTP 400", async () => {
      const response = await request(app)
        .get("/api/reports/daily")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects malformed date query parameter with HTTP 400", async () => {
      const response = await request(app)
        .get("/api/reports/daily?date=not-a-date")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects impossible calendar date with HTTP 400", async () => {
      const response = await request(app)
        .get("/api/reports/daily?date=2026-02-30")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("Invalid calendar date");
    });

    it("rejects future date with HTTP 400", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().slice(0, 10);

      const response = await request(app)
        .get(`/api/reports/daily?date=${futureDateStr}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("Future dates are not allowed");
    });

    it("strictly ignores any supplied userId in query and enforces token user identity", async () => {
      // Seed reading for User 1
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });

      // User 2 attempts to pass ?userId=user1Id
      const response = await request(app)
        .get(`/api/reports/daily?date=2026-05-10&userId=${user1Id}`)
        .set("Authorization", `Bearer ${token2}`)
        .expect(200);

      // User 2 should get an empty report because user2 has 0 readings
      expect(reportHasNoData(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/reports/daily (Daily Report)", () => {
    it("returns friendly empty state when there are no readings", async () => {
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
          highest: null,
          lowest: null,
          average: null,
          count: 0,
          totalReadings: 0,
          hasData: false,
          readings: [],
        },
      });
    });

    it("generates daily report with all four reading slots", async () => {
      // Seed readings for user 1
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

      // Also seed a reading for user 2 on the same date (to test user isolation)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token2}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 250 });

      const response = await request(app)
        .get("/api/reports/daily?date=2026-05-10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        reportType: ReportType.DAILY,
        startDate: "2026-05-10",
        endDate: "2026-05-10",
        highest: 160,
        lowest: 100,
        average: 130,
        count: 4,
        totalReadings: 4,
        hasData: true,
      });

      expect(response.body.data.readings).toHaveLength(4);
      // Readings must be sorted chronologically by slot order
      expect(response.body.data.readings[0].slot).toBe("MORNING");
      expect(response.body.data.readings[1].slot).toBe("AFTER_BREAKFAST");
      expect(response.body.data.readings[2].slot).toBe("AFTER_LUNCH");
      expect(response.body.data.readings[3].slot).toBe("AFTER_DINNER");
      // Individual reading shapes
      expect(response.body.data.readings[0]).toHaveProperty("id");
      expect(response.body.data.readings[0]).toHaveProperty("createdAt");
      expect(response.body.data.readings[0].glucoseValue).toBe(100);
      expect(response.body.data.readings[0].date).toBe("2026-05-10");
    });

    it("generates daily report with only one reading", async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 105 });

      const response = await request(app)
        .get("/api/reports/daily?date=2026-05-10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        reportType: ReportType.DAILY,
        highest: 105,
        lowest: 105,
        average: 105,
        count: 1,
        hasData: true,
      });
      expect(response.body.data.readings).toHaveLength(1);
    });

    it("rounds average accurately to one decimal place e.g. [100, 101] -> 100.5", async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_BREAKFAST", glucoseValue: 101 });

      const response = await request(app)
        .get("/api/reports/daily?date=2026-05-10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.average).toBe(100.5);
      expect(response.body.data.count).toBe(2);
    });
  });

  describe("GET /api/reports/month-to-date (Month-to-Date Report)", () => {
    it("returns friendly empty state when no readings exist", async () => {
      const response = await request(app)
        .get("/api/reports/month-to-date?date=2026-05-15")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        reportType: ReportType.MONTH_TO_DATE,
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
      });
    });

    it("includes readings from 1st of month through selected date inclusive, excluding later dates and other months", async () => {
      // 1. Reading on 1st day of month (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-01", slot: "MORNING", glucoseValue: 90 });

      // 2. Reading on selected date (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-15", slot: "AFTER_DINNER", glucoseValue: 150 });

      // 3. Reading between 1st and 15th (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_LUNCH", glucoseValue: 120 });

      // 4. Reading AFTER selected date (must be excluded)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-16", slot: "MORNING", glucoseValue: 300 });

      // 5. Reading in PREVIOUS month (must be excluded)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-04-30", slot: "AFTER_DINNER", glucoseValue: 400 });

      // 6. User 2 reading within range (must be excluded due to user isolation)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token2}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 500 });

      const response = await request(app)
        .get("/api/reports/month-to-date?date=2026-05-15")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // Only readings 1, 2, 3 should be aggregated: values [90, 150, 120]
      // Highest: 150, Lowest: 90, Average: (90 + 150 + 120)/3 = 360/3 = 120, Count: 3
      expect(response.body.data).toMatchObject({
        reportType: ReportType.MONTH_TO_DATE,
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        highest: 150,
        lowest: 90,
        average: 120,
        count: 3,
        totalReadings: 3,
        hasData: true,
      });
    });
  });

  describe("GET /api/reports/previous-month (Previous Full Month Report)", () => {
    it("returns friendly empty state when no readings exist in previous month", async () => {
      const response = await request(app)
        .get("/api/reports/previous-month?date=2026-05-15")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
      });
    });

    it("includes readings strictly within previous full calendar month", async () => {
      // 1. Reading on first day of previous month: April 1 (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-04-01", slot: "MORNING", glucoseValue: 95 });

      // 2. Reading on last day of previous month: April 30 (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-04-30", slot: "AFTER_DINNER", glucoseValue: 145 });

      // 3. Reading in mid April (included)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-04-15", slot: "AFTER_LUNCH", glucoseValue: 110 });

      // 4. Reading in March (prior to previous month, excluded)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-03-31", slot: "AFTER_DINNER", glucoseValue: 350 });

      // 5. Reading in May (current month, excluded)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-01", slot: "MORNING", glucoseValue: 400 });

      // 6. User 2 reading in April (user isolation, excluded)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token2}`)
        .send({ date: "2026-04-15", slot: "MORNING", glucoseValue: 500 });

      const response = await request(app)
        .get("/api/reports/previous-month?date=2026-05-15")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // Only [95, 145, 110]: sum 350 / 3 = 116.666 -> 116.7
      expect(response.body.data).toMatchObject({
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        highest: 145,
        lowest: 95,
        average: 116.7,
        count: 3,
        totalReadings: 3,
        hasData: true,
      });
    });

    it("correctly handles January input returning previous December", async () => {
      // Seed reading on 2025-12-15
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2025-12-15", slot: "MORNING", glucoseValue: 115 });

      const response = await request(app)
        .get("/api/reports/previous-month?date=2026-01-10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2025-12-01",
        endDate: "2025-12-31",
        highest: 115,
        lowest: 115,
        average: 115,
        count: 1,
        hasData: true,
      });
    });
  });
});

function reportHasNoData(data: { hasData: boolean; count: number; highest: unknown }): boolean {
  return data.hasData === false && data.count === 0 && data.highest === null;
}
