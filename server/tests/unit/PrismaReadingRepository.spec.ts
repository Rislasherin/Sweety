import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { PrismaReadingRepository } from "@infrastructure/repositories/PrismaReadingRepository";
import { DuplicateReadingSlotError } from "@domain/errors/ReadingErrors";
import { Reading } from "@domain/entities/Reading";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";

describe("PrismaReadingRepository Unit Tests", () => {
  let mockPrisma: {
    reading: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
  let repository: PrismaReadingRepository;

  const testUserId = "user-uuid-123";
  const testReading = Reading.create({
    id: "reading-uuid-456",
    userId: testUserId,
    date: new Date("2026-05-10T00:00:00.000Z"),
    slot: ReadingSlotType.MORNING,
    value: GlucoseValue.create(110),
    createdAt: new Date("2026-05-10T08:00:00.000Z"),
    updatedAt: new Date("2026-05-10T08:00:00.000Z"),
  });

  const prismaRow = {
    id: testReading.id,
    userId: testReading.userId,
    date: testReading.date,
    slot: testReading.slot,
    glucoseValue: testReading.value.getValue(),
    createdAt: testReading.createdAt,
    updatedAt: testReading.updatedAt,
  };

  beforeEach(() => {
    mockPrisma = {
      reading: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation((promises: Promise<unknown>[]) => Promise.all(promises)),
    };
    repository = new PrismaReadingRepository(mockPrisma as unknown as PrismaClient);
  });

  describe("save", () => {
    it("persists and returns mapped domain Reading", async () => {
      mockPrisma.reading.create.mockResolvedValue(prismaRow);

      const result = await repository.save(testReading);

      expect(mockPrisma.reading.create).toHaveBeenCalledWith({
        data: {
          id: testReading.id,
          userId: testReading.userId,
          date: testReading.date,
          slot: testReading.slot,
          glucoseValue: 110,
          createdAt: testReading.createdAt,
          updatedAt: testReading.updatedAt,
        },
      });
      expect(result.id).toBe(testReading.id);
      expect(result.value.getValue()).toBe(110);
    });

    it("translates Prisma P2002 error to DuplicateReadingSlotError", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`date`,`slot`)",
        {
          code: "P2002",
          clientVersion: "6.19.3",
        },
      );
      mockPrisma.reading.create.mockRejectedValue(p2002Error);

      await expect(repository.save(testReading)).rejects.toThrow(DuplicateReadingSlotError);
    });

    it("rethrows unexpected errors", async () => {
      const dbError = new Error("Database offline");
      mockPrisma.reading.create.mockRejectedValue(dbError);

      await expect(repository.save(testReading)).rejects.toThrow(dbError);
    });
  });

  describe("findById", () => {
    it("finds reading isolated by user ID and returns domain entity", async () => {
      mockPrisma.reading.findFirst.mockResolvedValue(prismaRow);

      const result = await repository.findById(testReading.id, testUserId);

      expect(mockPrisma.reading.findFirst).toHaveBeenCalledWith({
        where: {
          id: testReading.id,
          userId: testUserId,
        },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(testReading.id);
    });

    it("returns null when not found or belongs to another user", async () => {
      mockPrisma.reading.findFirst.mockResolvedValue(null);

      const result = await repository.findById("non-existent", testUserId);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("returns readings sorted by date DESC and slot order", async () => {
      const row1 = {
        ...prismaRow,
        id: "r1",
        date: new Date("2026-05-10T00:00:00.000Z"),
        slot: ReadingSlotType.AFTER_DINNER,
      };
      const row2 = {
        ...prismaRow,
        id: "r2",
        date: new Date("2026-05-10T00:00:00.000Z"),
        slot: ReadingSlotType.MORNING,
      };
      const row3 = {
        ...prismaRow,
        id: "r3",
        date: new Date("2026-05-09T00:00:00.000Z"),
        slot: ReadingSlotType.AFTER_LUNCH,
      };

      // Mock returns in unordered sequence
      mockPrisma.reading.findMany.mockResolvedValue([row1, row2, row3]);

      const results = await repository.findByUserId(testUserId);

      expect(results).toHaveLength(3);
      // Date 2026-05-10 comes first, with MORNING before AFTER_DINNER
      expect(results[0].slot).toBe(ReadingSlotType.MORNING);
      expect(results[1].slot).toBe(ReadingSlotType.AFTER_DINNER);
      // Date 2026-05-09 comes last
      expect(results[2].slot).toBe(ReadingSlotType.AFTER_LUNCH);
    });

    it("applies date filter when date is provided", async () => {
      mockPrisma.reading.findMany.mockResolvedValue([]);
      const filterDate = new Date("2026-05-10T00:00:00.000Z");

      await repository.findByUserId(testUserId, filterDate);

      expect(mockPrisma.reading.findMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          date: filterDate,
        },
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      });
    });
  });

  describe("findPaginatedByUserId", () => {
    it("queries database with calculated skip, take and returns total count and sorted readings", async () => {
      const row1 = {
        ...prismaRow,
        id: "r1",
        date: new Date("2026-05-10T00:00:00.000Z"),
        slot: ReadingSlotType.AFTER_DINNER,
      };
      const row2 = {
        ...prismaRow,
        id: "r2",
        date: new Date("2026-05-10T00:00:00.000Z"),
        slot: ReadingSlotType.MORNING,
      };

      mockPrisma.reading.count.mockResolvedValue(25);
      mockPrisma.reading.findMany.mockResolvedValue([row1, row2]);

      const result = await repository.findPaginatedByUserId(testUserId, {
        page: 2,
        limit: 10,
      });

      expect(mockPrisma.reading.count).toHaveBeenCalledWith({
        where: { userId: testUserId },
      });
      expect(mockPrisma.reading.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        skip: 10,
        take: 10,
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      });
      expect(result.total).toBe(25);
      expect(result.readings.length).toBe(2);
      expect(result.readings[0].slot).toBe(ReadingSlotType.MORNING);
      expect(result.readings[1].slot).toBe(ReadingSlotType.AFTER_DINNER);
    });

    it("includes date filter in count and findMany queries when date is provided", async () => {
      const filterDate = new Date("2026-05-10T00:00:00.000Z");
      mockPrisma.reading.count.mockResolvedValue(0);
      mockPrisma.reading.findMany.mockResolvedValue([]);

      const result = await repository.findPaginatedByUserId(testUserId, {
        page: 1,
        limit: 20,
        date: filterDate,
      });

      expect(mockPrisma.reading.count).toHaveBeenCalledWith({
        where: { userId: testUserId, date: filterDate },
      });
      expect(mockPrisma.reading.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId, date: filterDate },
        skip: 0,
        take: 20,
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      });
      expect(result.total).toBe(0);
      expect(result.readings).toEqual([]);
    });
  });

  describe("findByUserIdDateAndSlot", () => {
    it("queries using composite unique key and returns Reading", async () => {
      mockPrisma.reading.findUnique.mockResolvedValue(prismaRow);

      const result = await repository.findByUserIdDateAndSlot(
        testUserId,
        testReading.date,
        testReading.slot,
      );

      expect(mockPrisma.reading.findUnique).toHaveBeenCalledWith({
        where: {
          userId_date_slot: {
            userId: testUserId,
            date: testReading.date,
            slot: testReading.slot,
          },
        },
      });
      expect(result).not.toBeNull();
    });
  });

  describe("countByUserIdAndDate", () => {
    it("returns count for the specified user and date", async () => {
      mockPrisma.reading.count.mockResolvedValue(3);

      const count = await repository.countByUserIdAndDate(testUserId, testReading.date);

      expect(mockPrisma.reading.count).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          date: testReading.date,
        },
      });
      expect(count).toBe(3);
    });
  });

  describe("update", () => {
    it("updates and returns domain Reading", async () => {
      const updatedRow = { ...prismaRow, glucoseValue: 140 };
      mockPrisma.reading.update.mockResolvedValue(updatedRow);

      const updatedReading = testReading.update({
        value: GlucoseValue.create(140),
      });

      const result = await repository.update(updatedReading);

      expect(mockPrisma.reading.update).toHaveBeenCalledWith({
        where: { id: testReading.id },
        data: {
          date: testReading.date,
          slot: testReading.slot,
          glucoseValue: 140,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.value.getValue()).toBe(140);
    });

    it("translates P2002 to DuplicateReadingSlotError on update conflict", async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      });
      mockPrisma.reading.update.mockRejectedValue(p2002Error);

      await expect(repository.update(testReading)).rejects.toThrow(DuplicateReadingSlotError);
    });
  });

  describe("delete", () => {
    it("returns true when record was deleted", async () => {
      mockPrisma.reading.deleteMany.mockResolvedValue({ count: 1 });

      const result = await repository.delete(testReading.id, testUserId);

      expect(mockPrisma.reading.deleteMany).toHaveBeenCalledWith({
        where: {
          id: testReading.id,
          userId: testUserId,
        },
      });
      expect(result).toBe(true);
    });

    it("returns false when no record matched id and userId", async () => {
      mockPrisma.reading.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.delete("missing-id", testUserId);

      expect(result).toBe(false);
    });
  });

  describe("findByDateRange", () => {
    it("queries readings within inclusive date range", async () => {
      const startDate = new Date("2026-05-01T00:00:00.000Z");
      const endDate = new Date("2026-05-10T00:00:00.000Z");

      mockPrisma.reading.findMany.mockResolvedValue([prismaRow]);

      const result = await repository.findByDateRange(testUserId, startDate, endDate);

      expect(mockPrisma.reading.findMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testReading.id);
    });
  });

  describe("getAggregatedStats", () => {
    it("returns calculated stats when records exist in date range", async () => {
      const startDate = new Date("2026-05-01T00:00:00.000Z");
      const endDate = new Date("2026-05-10T00:00:00.000Z");

      mockPrisma.reading.aggregate.mockResolvedValue({
        _min: { glucoseValue: 95 },
        _max: { glucoseValue: 145 },
        _avg: { glucoseValue: 120.456 },
        _count: { _all: 10 },
      });

      const stats = await repository.getAggregatedStats(testUserId, startDate, endDate);

      expect(mockPrisma.reading.aggregate).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _min: { glucoseValue: true },
        _max: { glucoseValue: true },
        _avg: { glucoseValue: true },
        _count: { _all: true },
      });
      expect(stats).toEqual({
        highest: 145,
        lowest: 95,
        average: 120.5,
        count: 10,
      });
    });

    it("returns nulls and 0 count when no records exist in date range", async () => {
      const startDate = new Date("2026-05-01T00:00:00.000Z");
      const endDate = new Date("2026-05-10T00:00:00.000Z");

      mockPrisma.reading.aggregate.mockResolvedValue({
        _min: { glucoseValue: null },
        _max: { glucoseValue: null },
        _avg: { glucoseValue: null },
        _count: { _all: 0 },
      });

      const stats = await repository.getAggregatedStats(testUserId, startDate, endDate);

      expect(stats).toEqual({
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      });
    });
  });
});
