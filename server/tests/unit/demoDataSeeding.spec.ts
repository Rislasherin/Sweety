import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReadingSlot } from "@prisma/client";
import {
  getDaysInMonth,
  formatUtcYmd,
  getPreviousMonthDates,
  getCurrentMonthDates,
  generateDemoReadings,
  getGlucoseCategory,
  getRequiredDemoPassword,
} from "../../prisma/seed";

describe("Demo Data Seeding & Dynamic Date Generation Unit Tests", () => {
  describe("getGlucoseCategory", () => {
    it("categorizes values < 70 as LOW", () => {
      expect(getGlucoseCategory(40)).toBe("LOW");
      expect(getGlucoseCategory(65)).toBe("LOW");
      expect(getGlucoseCategory(69)).toBe("LOW");
    });

    it("categorizes values 70–99 as NORMAL", () => {
      expect(getGlucoseCategory(70)).toBe("NORMAL");
      expect(getGlucoseCategory(85)).toBe("NORMAL");
      expect(getGlucoseCategory(99)).toBe("NORMAL");
    });

    it("categorizes values 100–125 as ELEVATED", () => {
      expect(getGlucoseCategory(100)).toBe("ELEVATED");
      expect(getGlucoseCategory(115)).toBe("ELEVATED");
      expect(getGlucoseCategory(125)).toBe("ELEVATED");
    });

    it("categorizes values >= 126 as HIGH", () => {
      expect(getGlucoseCategory(126)).toBe("HIGH");
      expect(getGlucoseCategory(145)).toBe("HIGH");
      expect(getGlucoseCategory(200)).toBe("HIGH");
    });
  });

  describe("getDaysInMonth", () => {
    it("returns 29 for February in a leap year (2024)", () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it("returns 28 for February in a non-leap year (2025)", () => {
      expect(getDaysInMonth(2025, 2)).toBe(28);
    });

    it("handles centuries: 2000 is leap (29), 1900 is non-leap (28)", () => {
      expect(getDaysInMonth(2000, 2)).toBe(29);
      expect(getDaysInMonth(1900, 2)).toBe(28);
    });

    it("returns 31 for 31-day months (January, March, May, July, August, October, December)", () => {
      const months31 = [1, 3, 5, 7, 8, 10, 12];
      for (const m of months31) {
        expect(getDaysInMonth(2026, m)).toBe(31);
      }
    });

    it("returns 30 for 30-day months (April, June, September, November)", () => {
      const months30 = [4, 6, 9, 11];
      for (const m of months30) {
        expect(getDaysInMonth(2026, m)).toBe(30);
      }
    });
  });

  describe("formatUtcYmd", () => {
    it("formats year, month, and day with zero-padding", () => {
      expect(formatUtcYmd(2026, 3, 5)).toBe("2026-03-05");
      expect(formatUtcYmd(2026, 11, 12)).toBe("2026-11-12");
      expect(formatUtcYmd(2024, 1, 1)).toBe("2024-01-01");
    });
  });

  describe("getPreviousMonthDates", () => {
    it("calculates 8 distinct days for regular previous month (Nov 2026 -> Oct 2026)", () => {
      const refDate = new Date("2026-11-12T12:00:00.000Z");
      const res = getPreviousMonthDates(refDate);

      expect(res.year).toBe(2026);
      expect(res.month).toBe(10);
      expect(res.days).toHaveLength(8);
      // Days must be distinct, sorted, starting at 1 and ending at 31
      expect(new Set(res.days).size).toBe(8);
      expect(res.days[0]).toBe(1);
      expect(res.days[7]).toBe(31);
      for (let i = 1; i < res.days.length; i++) {
        expect(res.days[i]).toBeGreaterThan(res.days[i - 1]);
      }
    });

    it("correctly rolls over January to December of the previous year (Jan 2027 -> Dec 2026)", () => {
      const refDate = new Date("2027-01-01T00:00:00.000Z");
      const res = getPreviousMonthDates(refDate);

      expect(res.year).toBe(2026);
      expect(res.month).toBe(12);
      expect(res.days).toHaveLength(8);
      expect(res.days[0]).toBe(1);
      expect(res.days[7]).toBe(31);
    });

    it("handles February in a leap year (March 2024 -> Feb 2024 with 29 days)", () => {
      const refDate = new Date("2024-03-10T15:30:00.000Z");
      const res = getPreviousMonthDates(refDate);

      expect(res.year).toBe(2024);
      expect(res.month).toBe(2);
      expect(res.days).toHaveLength(8);
      expect(res.days[0]).toBe(1);
      expect(res.days[7]).toBe(29);
      expect(Math.max(...res.days)).toBe(29);
    });

    it("handles February in a non-leap year (March 2025 -> Feb 2025 with 28 days)", () => {
      const refDate = new Date("2025-03-10T15:30:00.000Z");
      const res = getPreviousMonthDates(refDate);

      expect(res.year).toBe(2025);
      expect(res.month).toBe(2);
      expect(res.days).toHaveLength(8);
      expect(res.days[0]).toBe(1);
      expect(res.days[7]).toBe(28);
      expect(Math.max(...res.days)).toBe(28);
    });
  });

  describe("getCurrentMonthDates", () => {
    it("handles day 1 of the month without generating future dates", () => {
      const refDate = new Date("2027-01-01T00:00:00.000Z");
      const res = getCurrentMonthDates(refDate);

      expect(res.year).toBe(2027);
      expect(res.month).toBe(1);
      expect(res.days).toEqual([1]);
      expect(res.days.every((d) => d <= 1)).toBe(true);
    });

    it("handles early-month execution (e.g. day 3)", () => {
      const refDate = new Date("2026-04-03T10:00:00.000Z");
      const res = getCurrentMonthDates(refDate);

      expect(res.year).toBe(2026);
      expect(res.month).toBe(4);
      expect(res.days).toEqual([1, 3]);
      expect(res.days.includes(2)).toBe(false); // day 2 is empty for empty-day testing
    });

    it("handles mid-month execution (e.g. 2026-11-12)", () => {
      const refDate = new Date("2026-11-12T00:00:00.000Z");
      const res = getCurrentMonthDates(refDate);

      expect(res.year).toBe(2026);
      expect(res.month).toBe(11);
      expect(res.days.length).toBeLessThanOrEqual(8);
      expect(res.days).toContain(12); // Includes today
      expect(Math.max(...res.days)).toBe(12); // Never future dates
      expect(res.days.includes(4)).toBe(false); // Day 4 remains unseeded
      expect(res.days.includes(6)).toBe(false); // Day 6 remains unseeded
    });

    it("handles end-of-month execution (e.g. 2026-05-31)", () => {
      const refDate = new Date("2026-05-31T23:59:59.000Z");
      const res = getCurrentMonthDates(refDate);

      expect(res.year).toBe(2026);
      expect(res.month).toBe(5);
      expect(res.days).toHaveLength(8);
      expect(res.days).toContain(31);
      expect(Math.max(...res.days)).toBe(31);
    });
  });

  describe("generateDemoReadings", () => {
    it("generates readings for controlled reference date 2026-11-12 covering all 4 categories and all 4 slots", () => {
      const refDate = new Date("2026-11-12T00:00:00.000Z");
      const readings = generateDemoReadings(refDate);

      expect(readings.length).toBeGreaterThan(0);

      // Verify UTC date consistency
      for (const entry of readings) {
        expect(entry.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.date.toISOString()).toBe(`${entry.dateStr}T00:00:00.000Z`);
        expect(Object.values(ReadingSlot)).toContain(entry.slot);
        expect(entry.glucoseValue).toBeGreaterThan(0);
      }

      // Verify all 4 slots are present across readings
      const distinctSlots = new Set(readings.map((r) => r.slot));
      expect(distinctSlots.size).toBe(4);
      expect(distinctSlots.has(ReadingSlot.MORNING)).toBe(true);
      expect(distinctSlots.has(ReadingSlot.AFTER_BREAKFAST)).toBe(true);
      expect(distinctSlots.has(ReadingSlot.AFTER_LUNCH)).toBe(true);
      expect(distinctSlots.has(ReadingSlot.AFTER_DINNER)).toBe(true);

      // Verify all 4 application clinical categories are represented in generated readings
      const categories = new Set(readings.map((r) => getGlucoseCategory(r.glucoseValue)));
      expect(categories.has("LOW")).toBe(true);
      expect(categories.has("NORMAL")).toBe(true);
      expect(categories.has("ELEVATED")).toBe(true);
      expect(categories.has("HIGH")).toBe(true);

      // Verify today (2026-11-12) showcases all 4 categories across its 4 slots
      const todayReadings = readings.filter((r) => r.dateStr === "2026-11-12");
      expect(todayReadings).toHaveLength(4);
      const todayCategories = new Set(todayReadings.map((r) => getGlucoseCategory(r.glucoseValue)));
      expect(todayCategories.has("LOW")).toBe(true); // MORNING: 68
      expect(todayCategories.has("NORMAL")).toBe(true); // AFTER_DINNER: 92
      expect(todayCategories.has("ELEVATED")).toBe(true); // AFTER_LUNCH: 115
      expect(todayCategories.has("HIGH")).toBe(true); // AFTER_BREAKFAST: 145

      // Verify unseeded days exist in November
      const seededNovDays = new Set(
        readings.filter((r) => r.dateStr.startsWith("2026-11-")).map((r) => r.dateStr),
      );
      expect(seededNovDays.has("2026-11-04")).toBe(false);
      expect(seededNovDays.has("2026-11-06")).toBe(false);
    });

    it("never generates future dates when reference date is Jan 1", () => {
      const refDate = new Date("2027-01-01T00:00:00.000Z");
      const readings = generateDemoReadings(refDate);

      const janReadings = readings.filter((r) => r.dateStr.startsWith("2027-01-"));
      expect(janReadings.length).toBeGreaterThan(0);
      for (const r of janReadings) {
        expect(r.dateStr).toBe("2027-01-01");
      }

      // Today on Jan 1 also contains all 4 categories
      const jan1Categories = new Set(janReadings.map((r) => getGlucoseCategory(r.glucoseValue)));
      expect(jan1Categories.has("LOW")).toBe(true);
      expect(jan1Categories.has("NORMAL")).toBe(true);
      expect(jan1Categories.has("ELEVATED")).toBe(true);
      expect(jan1Categories.has("HIGH")).toBe(true);

      // Previous month is December 2026
      const decReadings = readings.filter((r) => r.dateStr.startsWith("2026-12-"));
      expect(decReadings.length).toBe(32); // 8 days * 4 slots
    });
  });

  describe("getRequiredDemoPassword", () => {
    const originalEnv = process.env.DEMO_USER_PASSWORD;

    beforeEach(() => {
      delete process.env.DEMO_USER_PASSWORD;
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.DEMO_USER_PASSWORD = originalEnv;
      } else {
        delete process.env.DEMO_USER_PASSWORD;
      }
    });

    it("throws an error when DEMO_USER_PASSWORD is missing or empty", () => {
      expect(() => getRequiredDemoPassword()).toThrow(
        "Missing required environment variable: DEMO_USER_PASSWORD",
      );
      process.env.DEMO_USER_PASSWORD = "   ";
      expect(() => getRequiredDemoPassword()).toThrow(
        "Missing required environment variable: DEMO_USER_PASSWORD",
      );
    });

    it("throws an error when DEMO_USER_PASSWORD is less than 8 characters", () => {
      process.env.DEMO_USER_PASSWORD = "short";
      expect(() => getRequiredDemoPassword()).toThrow(
        "DEMO_USER_PASSWORD must be at least 8 characters long",
      );
    });

    it("returns the password when valid (>= 8 characters)", () => {
      process.env.DEMO_USER_PASSWORD = "StrongPassword2026!";
      expect(getRequiredDemoPassword()).toBe("StrongPassword2026!");
    });
  });
});
