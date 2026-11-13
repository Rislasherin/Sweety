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
import { Reading } from "@domain/entities/Reading";
import { type User } from "@domain/entities/User";
import { type Email } from "@domain/value-objects/Email";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { ReadingSlotType, READING_SLOT_ORDER } from "@domain/enums/ReadingSlotType";
import { DuplicateReadingSlotError } from "@domain/errors/ReadingErrors";
import { formatDateOnly, parseDateOnly, roundToOneDecimal } from "@domain/utils/dateUtils";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";

class InMemoryReadingRepository implements IReadingRepository {
  private readonly readings: Map<string, Reading> = new Map();

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
    const dateStr = formatDateOnly(reading.date);
    for (const existing of this.readings.values()) {
      if (
        existing.id !== reading.id &&
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

describe("Glucose Reading CRUD API (HTTP Integration)", () => {
  let readingRepo: InMemoryReadingRepository;
  let userRepo: InMemoryUserRepository;
  let tokenService: JwtTokenService;
  let app: ReturnType<typeof createApp>;

  const user1Id = "user-1111-1111";
  const user2Id = "user-2222-2222";
  let token1: string;
  let token2: string;

  beforeEach(async () => {
    readingRepo = new InMemoryReadingRepository();
    userRepo = new InMemoryUserRepository();
    tokenService = new JwtTokenService({
      secret: "integration-secret-test-key-32bytes-ok",
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

  describe("Authentication Guard", () => {
    it("rejects unauthenticated requests with HTTP 401", async () => {
      const response = await request(app).get("/api/readings").expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
    });

    it("rejects invalid Bearer tokens with HTTP 401", async () => {
      const response = await request(app)
        .get("/api/readings")
        .set("Authorization", "Bearer invalid.jwt.token")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/readings (Create Reading)", () => {
    it("creates a reading successfully and returns HTTP 201", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 105,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          userId: user1Id,
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 105,
        },
      });
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("createdAt");
      expect(response.body.data).toHaveProperty("updatedAt");
    });

    it("rejects empty body or missing required fields with HTTP 400", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
    });

    it("allows recording same slot on a different date with HTTP 201", async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 100,
        })
        .expect(201);

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-11",
          slot: "MORNING",
          glucoseValue: 105,
        })
        .expect(201);

      expect(response.body.data.date).toBe("2026-05-11");
      expect(response.body.data.slot).toBe("MORNING");
    });

    it("allows different users to have same date and slot with HTTP 201", async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 100,
        })
        .expect(201);

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 110,
        })
        .expect(201);

      expect(response.body.data.userId).toBe(user2Id);
      expect(response.body.data.slot).toBe("MORNING");
    });

    it("handles concurrent creation attempts for same user, date and slot", async () => {
      const results = await Promise.all([
        request(app)
          .post("/api/readings")
          .set("Authorization", `Bearer ${token1}`)
          .send({ date: "2026-05-12", slot: "MORNING", glucoseValue: 100 }),
        request(app)
          .post("/api/readings")
          .set("Authorization", `Bearer ${token1}`)
          .send({ date: "2026-05-12", slot: "MORNING", glucoseValue: 105 }),
      ]);

      const statusCodes = results.map((r) => r.status).sort();
      expect(statusCodes).toEqual([201, 409]);
    });

    it("rejects glucose value below 40 with HTTP 400", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 39,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects glucose value above 600 with HTTP 400", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 601,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects non-integer glucose value with HTTP 400", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 105.7,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects invalid slot with HTTP 400", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "BEDTIME",
          glucoseValue: 110,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("rejects future date with HTTP 400", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().slice(0, 10);

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: futureDateStr,
          slot: "MORNING",
          glucoseValue: 110,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Future dates are not allowed",
      });
    });

    it("rejects duplicate slot on same day with HTTP 409", async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 100,
        })
        .expect(201);

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 115,
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: "A reading for this slot already exists on this date",
      });
    });

    it("rejects exceeding daily limit of 4 slots with HTTP 400", async () => {
      const slots: ReadingSlotType[] = [
        ReadingSlotType.MORNING,
        ReadingSlotType.AFTER_BREAKFAST,
        ReadingSlotType.AFTER_LUNCH,
        ReadingSlotType.AFTER_DINNER,
      ];

      for (const slot of slots) {
        await request(app)
          .post("/api/readings")
          .set("Authorization", `Bearer ${token1}`)
          .send({
            date: "2026-05-10",
            slot,
            glucoseValue: 110,
          })
          .expect(201);
      }

      // Pre-seed an additional reading to simulate limit check
      readingRepo["readings"].set(
        "fake-id",
        Reading.create({
          id: "fake-id",
          userId: user1Id,
          date: parseDateOnly("2026-05-10"),
          slot: "OTHER" as unknown as ReadingSlotType,
          value: GlucoseValue.create(120),
        }),
      );

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          date: "2026-05-10",
          slot: "MORNING",
          glucoseValue: 130,
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/readings (List Readings)", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_DINNER", glucoseValue: 130 });

      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 95 });

      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-09", slot: "AFTER_LUNCH", glucoseValue: 120 });

      // User 2 reading
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token2}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });
    });

    it("returns authenticated user's readings sorted by date DESC and slot order with default pagination", async () => {
      const response = await request(app)
        .get("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      // user2 reading should not be returned
      expect(response.body.data.every((r: { userId: string }) => r.userId === user1Id)).toBe(true);

      // 2026-05-10 MORNING should be first, then AFTER_DINNER, then 2026-05-09
      expect(response.body.data[0].date).toBe("2026-05-10");
      expect(response.body.data[0].slot).toBe("MORNING");
      expect(response.body.data[1].date).toBe("2026-05-10");
      expect(response.body.data[1].slot).toBe("AFTER_DINNER");
      expect(response.body.data[2].date).toBe("2026-05-09");

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it("paginates readings correctly with custom page and limit", async () => {
      // Page 1 with limit 2
      const page1Res = await request(app)
        .get("/api/readings?page=1&limit=2")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(page1Res.body.data).toHaveLength(2);
      expect(page1Res.body.data[0].slot).toBe("MORNING");
      expect(page1Res.body.data[1].slot).toBe("AFTER_DINNER");
      expect(page1Res.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });

      // Page 2 with limit 2
      const page2Res = await request(app)
        .get("/api/readings?page=2&limit=2")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(page2Res.body.data).toHaveLength(1);
      expect(page2Res.body.data[0].date).toBe("2026-05-09");
      expect(page2Res.body.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it("combines date filtering with pagination", async () => {
      const response = await request(app)
        .get("/api/readings?date=2026-05-10&page=1&limit=1")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].date).toBe("2026-05-10");
      expect(response.body.data[0].slot).toBe("MORNING");
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it("returns empty array and appropriate pagination metadata for out-of-range page", async () => {
      const response = await request(app)
        .get("/api/readings?page=99&limit=10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toMatchObject({
        page: 99,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it("rejects invalid page parameters with HTTP 400", async () => {
      // page = 0
      const resZero = await request(app)
        .get("/api/readings?page=0")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resZero.body.success).toBe(false);

      // page = -5
      const resNeg = await request(app)
        .get("/api/readings?page=-5")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resNeg.body.success).toBe(false);

      // page = string
      const resStr = await request(app)
        .get("/api/readings?page=invalid")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resStr.body.success).toBe(false);
    });

    it("rejects invalid limit parameters with HTTP 400", async () => {
      // limit = 0
      const resZero = await request(app)
        .get("/api/readings?limit=0")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resZero.body.success).toBe(false);

      // limit > 100
      const resOver = await request(app)
        .get("/api/readings?limit=101")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resOver.body.success).toBe(false);

      // limit = non-integer
      const resFloat = await request(app)
        .get("/api/readings?limit=10.5")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);
      expect(resFloat.body.success).toBe(false);
    });

    it("filters by date query param ?date=YYYY-MM-DD", async () => {
      const response = await request(app)
        .get("/api/readings?date=2026-05-10")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((r: { date: string }) => r.date === "2026-05-10")).toBe(true);
    });

    it("returns empty array with HTTP 200 when user has no readings", async () => {
      const emptyUserToken = tokenService.generate({
        userId: "user-empty-9999",
        email: "empty@example.com",
      });

      const response = await request(app)
        .get("/api/readings")
        .set("Authorization", `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it("rejects invalid date query filter with HTTP 400", async () => {
      const response = await request(app)
        .get("/api/readings?date=invalid-date")
        .set("Authorization", `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/readings/:id (Get One Reading)", () => {
    let readingId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 105 });
      readingId = res.body.data.id;
    });

    it("retrieves own reading by ID with HTTP 200", async () => {
      const response = await request(app)
        .get(`/api/readings/${readingId}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: readingId,
        userId: user1Id,
        glucoseValue: 105,
      });
    });

    it("returns HTTP 404 when reading belongs to another user (User Isolation)", async () => {
      const response = await request(app)
        .get(`/api/readings/${readingId}`)
        .set("Authorization", `Bearer ${token2}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Reading not found",
      });
    });

    it("returns HTTP 404 for non-existent reading ID", async () => {
      const response = await request(app)
        .get("/api/readings/non-existent-id")
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("PATCH /api/readings/:id (Update Reading)", () => {
    let reading1Id: string;
    let reading2Id: string;

    beforeEach(async () => {
      const res1 = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });
      reading1Id = res1.body.data.id;

      const res2 = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_BREAKFAST", glucoseValue: 140 });
      reading2Id = res2.body.data.id;
    });

    it("updates glucose value with HTTP 200", async () => {
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ glucoseValue: 112 })
        .expect(200);

      expect(response.body.data.glucoseValue).toBe(112);
      expect(response.body.data.slot).toBe("MORNING");
    });

    it("updates slot with HTTP 200", async () => {
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ slot: "AFTER_DINNER" })
        .expect(200);

      expect(response.body.data.slot).toBe("AFTER_DINNER");
    });

    it("updates date with HTTP 200", async () => {
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-08" })
        .expect(200);

      expect(response.body.data.date).toBe("2026-05-08");
    });

    it("rejects slot conflict with HTTP 409", async () => {
      // Trying to change reading2's slot to MORNING which already exists on 2026-05-10
      const response = await request(app)
        .patch(`/api/readings/${reading2Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ slot: "MORNING" })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: "A reading for this slot already exists on this date",
      });
    });

    it("rejects invalid glucose value with HTTP 400", async () => {
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ glucoseValue: 25 })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });

    it("returns HTTP 404 when attempting to update another user's reading", async () => {
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ glucoseValue: 120 })
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
    });

    it("updating only glucoseValue on a day with 4 readings succeeds without false daily limit error", async () => {
      // Add the remaining 2 slots for 2026-05-10 (reading1 is MORNING, reading2 is AFTER_BREAKFAST)
      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_LUNCH", glucoseValue: 130 })
        .expect(201);

      await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "AFTER_DINNER", glucoseValue: 135 })
        .expect(201);

      // Now 2026-05-10 has exactly 4 readings. Updating reading1's glucose value should succeed.
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ glucoseValue: 102 })
        .expect(200);

      expect(response.body.data.glucoseValue).toBe(102);
    });

    it("rejects moving a reading to another date that already has 4 readings with HTTP 400", async () => {
      // Populate 4 readings on target date 2026-05-01
      const slots = [
        ReadingSlotType.MORNING,
        ReadingSlotType.AFTER_BREAKFAST,
        ReadingSlotType.AFTER_LUNCH,
        ReadingSlotType.AFTER_DINNER,
      ];
      for (const slot of slots) {
        await request(app)
          .post("/api/readings")
          .set("Authorization", `Bearer ${token1}`)
          .send({ date: "2026-05-01", slot, glucoseValue: 110 })
          .expect(201);
      }

      // Try to move reading1Id (currently on 2026-05-10) to 2026-05-01
      const response = await request(app)
        .patch(`/api/readings/${reading1Id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-01" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("Daily reading limit of 4 readings has been reached");
    });
  });

  describe("DELETE /api/readings/:id (Delete Reading)", () => {
    let readingId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ date: "2026-05-10", slot: "MORNING", glucoseValue: 100 });
      readingId = res.body.data.id;
    });

    it("deletes own reading with HTTP 200", async () => {
      const response = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Reading deleted successfully",
      });

      // Verify it's gone
      await request(app)
        .get(`/api/readings/${readingId}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);
    });

    it("returns HTTP 404 when trying to delete another user's reading", async () => {
      const response = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set("Authorization", `Bearer ${token2}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Reading not found",
      });
    });

    it("returns HTTP 404 when deleting non-existent reading", async () => {
      const response = await request(app)
        .delete("/api/readings/missing-uuid")
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});
