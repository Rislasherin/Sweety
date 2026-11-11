import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateDailyReportUseCase } from "@application/use-cases/report/implementations/GenerateDailyReportUseCase";
import { GenerateMonthToDateReportUseCase } from "@application/use-cases/report/implementations/GenerateMonthToDateReportUseCase";
import { GeneratePreviousMonthReportUseCase } from "@application/use-cases/report/implementations/GeneratePreviousMonthReportUseCase";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { Reading } from "@domain/entities/Reading";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";
import { ReportType } from "@application/dtos/report/Response/ReportResponseDTO";
import { parseDateOnly } from "@domain/utils/dateUtils";
import { FutureDateError, InvalidDateError } from "@domain/errors/ReadingErrors";

describe("Report Use Cases (Unit Tests)", () => {
  let mockReadingRepository: {
    findByUserId: ReturnType<typeof vi.fn>;
    getAggregatedStats: ReturnType<typeof vi.fn>;
  };

  const userId = "test-user-123";

  beforeEach(() => {
    mockReadingRepository = {
      findByUserId: vi.fn(),
      getAggregatedStats: vi.fn(),
    };
  });

  describe("GenerateDailyReportUseCase", () => {
    let useCase: GenerateDailyReportUseCase;

    beforeEach(() => {
      useCase = new GenerateDailyReportUseCase(
        mockReadingRepository as unknown as IReadingRepository,
      );
    });

    it("generates report with all four reading slots", async () => {
      const selectedDate = "2026-05-10";
      const parsedDate = parseDateOnly(selectedDate);

      const readings = [
        Reading.create({
          id: "r1",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.MORNING,
          value: GlucoseValue.create(100),
          createdAt: new Date("2026-05-10T08:00:00Z"),
        }),
        Reading.create({
          id: "r2",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.AFTER_BREAKFAST,
          value: GlucoseValue.create(120),
          createdAt: new Date("2026-05-10T10:00:00Z"),
        }),
        Reading.create({
          id: "r3",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.AFTER_LUNCH,
          value: GlucoseValue.create(140),
          createdAt: new Date("2026-05-10T14:00:00Z"),
        }),
        Reading.create({
          id: "r4",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.AFTER_DINNER,
          value: GlucoseValue.create(160),
          createdAt: new Date("2026-05-10T20:00:00Z"),
        }),
      ];

      mockReadingRepository.findByUserId.mockResolvedValue(readings);

      const report = await useCase.execute(userId, selectedDate);

      expect(report).toEqual({
        reportType: ReportType.DAILY,
        startDate: "2026-05-10",
        endDate: "2026-05-10",
        highest: 160,
        lowest: 100,
        average: 130,
        count: 4,
        totalReadings: 4,
        hasData: true,
        readings: [
          {
            id: "r1",
            date: "2026-05-10",
            slot: ReadingSlotType.MORNING,
            glucoseValue: 100,
            createdAt: "2026-05-10T08:00:00.000Z",
          },
          {
            id: "r2",
            date: "2026-05-10",
            slot: ReadingSlotType.AFTER_BREAKFAST,
            glucoseValue: 120,
            createdAt: "2026-05-10T10:00:00.000Z",
          },
          {
            id: "r3",
            date: "2026-05-10",
            slot: ReadingSlotType.AFTER_LUNCH,
            glucoseValue: 140,
            createdAt: "2026-05-10T14:00:00.000Z",
          },
          {
            id: "r4",
            date: "2026-05-10",
            slot: ReadingSlotType.AFTER_DINNER,
            glucoseValue: 160,
            createdAt: "2026-05-10T20:00:00.000Z",
          },
        ],
      });
    });

    it("generates report with only one reading", async () => {
      const selectedDate = "2026-05-10";
      const parsedDate = parseDateOnly(selectedDate);

      const readings = [
        Reading.create({
          id: "r1",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.MORNING,
          value: GlucoseValue.create(105),
          createdAt: new Date("2026-05-10T08:00:00Z"),
        }),
      ];

      mockReadingRepository.findByUserId.mockResolvedValue(readings);

      const report = await useCase.execute(userId, selectedDate);

      expect(report.highest).toBe(105);
      expect(report.lowest).toBe(105);
      expect(report.average).toBe(105);
      expect(report.count).toBe(1);
      expect(report.hasData).toBe(true);
      expect(report.readings).toHaveLength(1);
    });

    it("calculates accurate decimal average e.g. [100, 101] -> 100.5", async () => {
      const selectedDate = "2026-05-10";
      const parsedDate = parseDateOnly(selectedDate);

      const readings = [
        Reading.create({
          id: "r1",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.MORNING,
          value: GlucoseValue.create(100),
          createdAt: new Date("2026-05-10T08:00:00Z"),
        }),
        Reading.create({
          id: "r2",
          userId,
          date: parsedDate,
          slot: ReadingSlotType.AFTER_BREAKFAST,
          value: GlucoseValue.create(101),
          createdAt: new Date("2026-05-10T10:00:00Z"),
        }),
      ];

      mockReadingRepository.findByUserId.mockResolvedValue(readings);

      const report = await useCase.execute(userId, selectedDate);

      expect(report.average).toBe(100.5);
      expect(report.highest).toBe(101);
      expect(report.lowest).toBe(100);
      expect(report.count).toBe(2);
    });

    it("returns friendly empty state when there are no readings", async () => {
      mockReadingRepository.findByUserId.mockResolvedValue([]);

      const report = await useCase.execute(userId, "2026-05-10");

      expect(report).toEqual({
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
      });
    });

    it("rejects future date with FutureDateError", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().slice(0, 10);

      await expect(useCase.execute(userId, futureDateStr)).rejects.toThrow(FutureDateError);
    });

    it("rejects invalid date string with InvalidDateError", async () => {
      await expect(useCase.execute(userId, "not-a-date")).rejects.toThrow(InvalidDateError);
    });
  });

  describe("GenerateMonthToDateReportUseCase", () => {
    let useCase: GenerateMonthToDateReportUseCase;

    beforeEach(() => {
      useCase = new GenerateMonthToDateReportUseCase(
        mockReadingRepository as unknown as IReadingRepository,
      );
    });

    it("generates month-to-date report using repository aggregated stats", async () => {
      mockReadingRepository.getAggregatedStats.mockResolvedValue({
        highest: 155,
        lowest: 92,
        average: 118.4,
        count: 14,
      });

      const report = await useCase.execute(userId, "2026-05-15");

      expect(mockReadingRepository.getAggregatedStats).toHaveBeenCalledWith(
        userId,
        new Date("2026-05-01T00:00:00.000Z"),
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(report).toEqual({
        reportType: ReportType.MONTH_TO_DATE,
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        highest: 155,
        lowest: 92,
        average: 118.4,
        count: 14,
        totalReadings: 14,
        hasData: true,
      });
    });

    it("returns friendly empty state when no readings exist month-to-date", async () => {
      mockReadingRepository.getAggregatedStats.mockResolvedValue({
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      });

      const report = await useCase.execute(userId, "2026-05-15");

      expect(report).toEqual({
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

    it("rejects future date with FutureDateError", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().slice(0, 10);

      await expect(useCase.execute(userId, futureDateStr)).rejects.toThrow(FutureDateError);
    });
  });

  describe("GeneratePreviousMonthReportUseCase", () => {
    let useCase: GeneratePreviousMonthReportUseCase;

    beforeEach(() => {
      useCase = new GeneratePreviousMonthReportUseCase(
        mockReadingRepository as unknown as IReadingRepository,
      );
    });

    it("generates previous month report for full calendar month", async () => {
      mockReadingRepository.getAggregatedStats.mockResolvedValue({
        highest: 165,
        lowest: 88,
        average: 122.1,
        count: 40,
      });

      const report = await useCase.execute(userId, "2026-05-10");

      expect(mockReadingRepository.getAggregatedStats).toHaveBeenCalledWith(
        userId,
        new Date("2026-04-01T00:00:00.000Z"),
        new Date("2026-04-30T00:00:00.000Z"),
      );

      expect(report).toEqual({
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        highest: 165,
        lowest: 88,
        average: 122.1,
        count: 40,
        totalReadings: 40,
        hasData: true,
      });
    });

    it("handles January input transitioning to December of previous year", async () => {
      mockReadingRepository.getAggregatedStats.mockResolvedValue({
        highest: 170,
        lowest: 90,
        average: 125.0,
        count: 35,
      });

      const report = await useCase.execute(userId, "2026-01-10");

      expect(mockReadingRepository.getAggregatedStats).toHaveBeenCalledWith(
        userId,
        new Date("2025-12-01T00:00:00.000Z"),
        new Date("2025-12-31T00:00:00.000Z"),
      );

      expect(report.startDate).toBe("2025-12-01");
      expect(report.endDate).toBe("2025-12-31");
      expect(report.count).toBe(35);
      expect(report.hasData).toBe(true);
    });

    it("returns friendly empty state when no readings exist for previous month", async () => {
      mockReadingRepository.getAggregatedStats.mockResolvedValue({
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      });

      const report = await useCase.execute(userId, "2026-05-10");

      expect(report).toEqual({
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

    it("rejects future date with FutureDateError", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().slice(0, 10);

      await expect(useCase.execute(userId, futureDateStr)).rejects.toThrow(FutureDateError);
    });
  });
});
