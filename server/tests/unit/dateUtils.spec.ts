import { describe, it, expect } from "vitest";
import {
  parseDateOnly,
  formatDateOnly,
  getDailyDateRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  roundToOneDecimal,
  calculateDailyTrends,
} from "@domain/utils/dateUtils";
import { InvalidDateError } from "@domain/errors/ReadingErrors";

describe("Date Utilities & Range Calculations (Unit Tests)", () => {
  describe("roundToOneDecimal", () => {
    it("handles integers and returns same number", () => {
      expect(roundToOneDecimal(130)).toBe(130);
      expect(roundToOneDecimal(0)).toBe(0);
    });

    it("rounds numbers accurately to 1 decimal place", () => {
      expect(roundToOneDecimal(100.5)).toBe(100.5);
      expect(roundToOneDecimal(100.55)).toBe(100.6);
      expect(roundToOneDecimal(100.54)).toBe(100.5);
      expect(roundToOneDecimal(120.456)).toBe(120.5);
      expect(roundToOneDecimal(99.99)).toBe(100);
    });
  });

  describe("parseDateOnly and calendar validation", () => {
    it("parses valid YYYY-MM-DD to UTC midnight date", () => {
      const parsed = parseDateOnly("2026-11-11");
      expect(parsed.toISOString()).toBe("2026-11-11T00:00:00.000Z");
      expect(formatDateOnly(parsed)).toBe("2026-11-11");
    });

    it("rejects invalid format with InvalidDateError", () => {
      expect(() => parseDateOnly("11-11-2026")).toThrow(InvalidDateError);
      expect(() => parseDateOnly("invalid-date")).toThrow(InvalidDateError);
    });

    it("rejects impossible calendar dates", () => {
      expect(() => parseDateOnly("2026-02-29")).toThrow(InvalidDateError); // 2026 is non-leap year
      expect(() => parseDateOnly("2026-04-31")).toThrow(InvalidDateError); // April has 30 days
      expect(() => parseDateOnly("2026-13-01")).toThrow(InvalidDateError); // Month 13 impossible
    });

    it("accepts leap-year February 29", () => {
      const parsed = parseDateOnly("2024-02-29");
      expect(formatDateOnly(parsed)).toBe("2024-02-29");
    });
  });

  describe("getDailyDateRange", () => {
    it("returns start and end date as selected date", () => {
      const date = parseDateOnly("2026-11-11");
      const range = getDailyDateRange(date);

      expect(range.startDateStr).toBe("2026-11-11");
      expect(range.endDateStr).toBe("2026-11-11");
      expect(range.startDate.getTime()).toBe(date.getTime());
      expect(range.endDate.getTime()).toBe(date.getTime());
    });
  });

  describe("getMonthToDateRange", () => {
    it("returns range from 1st of month to selected date inclusive", () => {
      const date = parseDateOnly("2026-11-11");
      const range = getMonthToDateRange(date);

      expect(range.startDateStr).toBe("2026-11-01");
      expect(range.endDateStr).toBe("2026-11-11");
      expect(range.startDate.toISOString()).toBe("2026-11-01T00:00:00.000Z");
      expect(range.endDate.toISOString()).toBe("2026-11-11T00:00:00.000Z");
    });

    it("handles first day of the month", () => {
      const date = parseDateOnly("2026-11-01");
      const range = getMonthToDateRange(date);

      expect(range.startDateStr).toBe("2026-11-01");
      expect(range.endDateStr).toBe("2026-11-01");
    });

    it("handles last day of the month", () => {
      const date = parseDateOnly("2026-11-30");
      const range = getMonthToDateRange(date);

      expect(range.startDateStr).toBe("2026-11-01");
      expect(range.endDateStr).toBe("2026-11-30");
    });
  });

  describe("getPreviousMonthRange", () => {
    it("calculates October for November date (31 days)", () => {
      const date = parseDateOnly("2026-11-11");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2026-10-01");
      expect(range.endDateStr).toBe("2026-10-31");
      expect(range.startDate.toISOString()).toBe("2026-10-01T00:00:00.000Z");
      expect(range.endDate.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    });

    it("calculates December of previous year for January date", () => {
      const date = parseDateOnly("2026-01-15");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2025-12-01");
      expect(range.endDateStr).toBe("2025-12-31");
      expect(range.startDate.toISOString()).toBe("2025-12-01T00:00:00.000Z");
      expect(range.endDate.toISOString()).toBe("2025-12-31T00:00:00.000Z");
    });

    it("calculates leap-year February (29 days) for March date in 2024", () => {
      const date = parseDateOnly("2024-03-10");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2024-02-01");
      expect(range.endDateStr).toBe("2024-02-29");
    });

    it("calculates non-leap-year February (28 days) for March date in 2025", () => {
      const date = parseDateOnly("2025-03-10");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2025-02-01");
      expect(range.endDateStr).toBe("2025-02-28");
    });

    it("calculates April (30 days) for May date", () => {
      const date = parseDateOnly("2026-05-20");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2026-04-01");
      expect(range.endDateStr).toBe("2026-04-30");
    });

    it("calculates July (31 days) for August date", () => {
      const date = parseDateOnly("2026-08-05");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2026-07-01");
      expect(range.endDateStr).toBe("2026-07-31");
    });

    it("calculates August (31 days) for September date", () => {
      const date = parseDateOnly("2026-09-15");
      const range = getPreviousMonthRange(date);

      expect(range.startDateStr).toBe("2026-08-01");
      expect(range.endDateStr).toBe("2026-08-31");
    });
  });

  describe("calculateDailyTrends", () => {
    it("returns empty array when input is empty or null", () => {
      expect(calculateDailyTrends([])).toEqual([]);
      expect(calculateDailyTrends(null as unknown as [])).toEqual([]);
    });

    it("calculates single daily trend point correctly", () => {
      const items = [{ date: "2026-05-02", glucoseValue: 110 }];
      const result = calculateDailyTrends(items);

      expect(result).toEqual([
        {
          date: "2026-05-02",
          average: 110,
          count: 1,
          highest: 110,
          lowest: 110,
        },
      ]);
    });

    it("aggregates multiple readings on the same day into one point with accurate average", () => {
      const items = [
        { date: "2026-05-10", glucoseValue: 90 },
        { date: "2026-05-10", glucoseValue: 120 },
        { date: "2026-05-10", glucoseValue: 140 },
        { date: "2026-05-10", glucoseValue: 160 },
      ];
      const result = calculateDailyTrends(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: "2026-05-10",
        average: 127.5,
        count: 4,
        highest: 160,
        lowest: 90,
      });
    });

    it("sorts multiple days chronologically in ascending order", () => {
      const items = [
        { date: new Date("2026-05-15T00:00:00Z"), glucoseValue: 130 },
        { date: new Date("2026-05-01T00:00:00Z"), glucoseValue: 95 },
        { date: new Date("2026-05-07T00:00:00Z"), glucoseValue: 115 },
      ];
      const result = calculateDailyTrends(items);

      expect(result.map((p) => p.date)).toEqual(["2026-05-01", "2026-05-07", "2026-05-15"]);
      expect(result[0].average).toBe(95);
      expect(result[1].average).toBe(115);
      expect(result[2].average).toBe(130);
    });

    it("rounds average correctly to 1 decimal place e.g. [100, 101] -> 100.5", () => {
      const items = [
        { date: "2026-05-05", glucoseValue: 100 },
        { date: "2026-05-05", glucoseValue: 101 },
      ];
      const result = calculateDailyTrends(items);

      expect(result[0].average).toBe(100.5);
    });
  });
});
