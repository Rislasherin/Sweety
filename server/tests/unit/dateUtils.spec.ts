import { describe, it, expect } from "vitest";
import {
  parseDateOnly,
  formatDateOnly,
  getDailyDateRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  roundToOneDecimal,
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
});
