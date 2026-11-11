import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateReadingUseCase } from "@application/use-cases/reading/implementations/CreateReadingUseCase";
import { GetUserReadingsUseCase } from "@application/use-cases/reading/implementations/GetUserReadingsUseCase";
import { GetReadingByIdUseCase } from "@application/use-cases/reading/implementations/GetReadingByIdUseCase";
import { UpdateReadingUseCase } from "@application/use-cases/reading/implementations/UpdateReadingUseCase";
import { DeleteReadingUseCase } from "@application/use-cases/reading/implementations/DeleteReadingUseCase";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { Reading } from "@domain/entities/Reading";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";
import {
  DailyReadingLimitExceededError,
  DuplicateReadingSlotError,
  FutureDateError,
  ReadingNotFoundError,
} from "@domain/errors/ReadingErrors";
import { DomainError } from "@domain/errors/DomainError";
import { parseDateOnly } from "@domain/utils/dateUtils";

describe("Reading Use Cases Unit Tests", () => {
  let readingRepository: IReadingRepository;
  let createUseCase: CreateReadingUseCase;
  let getUserReadingsUseCase: GetUserReadingsUseCase;
  let getReadingByIdUseCase: GetReadingByIdUseCase;
  let updateUseCase: UpdateReadingUseCase;
  let deleteUseCase: DeleteReadingUseCase;

  const userId = "user-uuid-1";
  const otherUserId = "user-uuid-2";

  const sampleReading = Reading.create({
    id: "reading-uuid-1",
    userId,
    date: parseDateOnly("2026-11-10"),
    slot: ReadingSlotType.MORNING,
    value: GlucoseValue.create(120),
    createdAt: new Date("2026-11-10T08:00:00Z"),
    updatedAt: new Date("2026-11-10T08:00:00Z"),
  });

  beforeEach(() => {
    readingRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdDateAndSlot: vi.fn(),
      countByUserIdAndDate: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    createUseCase = new CreateReadingUseCase(readingRepository);
    getUserReadingsUseCase = new GetUserReadingsUseCase(readingRepository);
    getReadingByIdUseCase = new GetReadingByIdUseCase(readingRepository);
    updateUseCase = new UpdateReadingUseCase(readingRepository);
    deleteUseCase = new DeleteReadingUseCase(readingRepository);
  });

  describe("CreateReadingUseCase", () => {
    it("1. Successfully creates a valid reading", async () => {
      vi.mocked(readingRepository.countByUserIdAndDate).mockResolvedValue(0);
      vi.mocked(readingRepository.findByUserIdDateAndSlot).mockResolvedValue(null);
      vi.mocked(readingRepository.save).mockImplementation(async (r) => r);

      const result = await createUseCase.execute(userId, {
        date: "2026-11-10",
        slot: ReadingSlotType.MORNING,
        glucoseValue: 120,
      });

      expect(result.userId).toBe(userId);
      expect(result.date).toBe("2026-11-10");
      expect(result.slot).toBe(ReadingSlotType.MORNING);
      expect(result.glucoseValue).toBe(120);
      expect(readingRepository.save).toHaveBeenCalledTimes(1);
    });

    it("2. Rejects future dates with FutureDateError", async () => {
      await expect(
        createUseCase.execute(userId, {
          date: "2099-01-01",
          slot: ReadingSlotType.MORNING,
          glucoseValue: 100,
        }),
      ).rejects.toThrow(FutureDateError);

      expect(readingRepository.save).not.toHaveBeenCalled();
    });

    it("3. Rejects glucose value below 40 with DomainError", async () => {
      await expect(
        createUseCase.execute(userId, {
          date: "2026-11-10",
          slot: ReadingSlotType.MORNING,
          glucoseValue: 39,
        }),
      ).rejects.toThrow(DomainError);
    });

    it("4. Rejects glucose value above 600 with DomainError", async () => {
      await expect(
        createUseCase.execute(userId, {
          date: "2026-11-10",
          slot: ReadingSlotType.MORNING,
          glucoseValue: 601,
        }),
      ).rejects.toThrow(DomainError);
    });

    it("5. Rejects 5th reading on same day with DailyReadingLimitExceededError", async () => {
      vi.mocked(readingRepository.countByUserIdAndDate).mockResolvedValue(4);

      await expect(
        createUseCase.execute(userId, {
          date: "2026-11-10",
          slot: ReadingSlotType.AFTER_DINNER,
          glucoseValue: 130,
        }),
      ).rejects.toThrow(DailyReadingLimitExceededError);

      expect(readingRepository.save).not.toHaveBeenCalled();
    });

    it("6. Rejects duplicate slot on same day with DuplicateReadingSlotError", async () => {
      vi.mocked(readingRepository.countByUserIdAndDate).mockResolvedValue(1);
      vi.mocked(readingRepository.findByUserIdDateAndSlot).mockResolvedValue(sampleReading);

      await expect(
        createUseCase.execute(userId, {
          date: "2026-11-10",
          slot: ReadingSlotType.MORNING,
          glucoseValue: 140,
        }),
      ).rejects.toThrow(DuplicateReadingSlotError);

      expect(readingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("GetUserReadingsUseCase", () => {
    it("1. Retrieves user's own readings", async () => {
      vi.mocked(readingRepository.findByUserId).mockResolvedValue([sampleReading]);

      const results = await getUserReadingsUseCase.execute(userId);

      expect(readingRepository.findByUserId).toHaveBeenCalledWith(userId, undefined);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("reading-uuid-1");
    });

    it("2. Filters readings by date", async () => {
      vi.mocked(readingRepository.findByUserId).mockResolvedValue([sampleReading]);

      const results = await getUserReadingsUseCase.execute(userId, "2026-11-10");

      expect(readingRepository.findByUserId).toHaveBeenCalledWith(userId, expect.any(Date));
      expect(results.length).toBe(1);
    });
  });

  describe("GetReadingByIdUseCase", () => {
    it("1. Retrieves single reading when it belongs to user", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(sampleReading);

      const result = await getReadingByIdUseCase.execute(userId, "reading-uuid-1");

      expect(readingRepository.findById).toHaveBeenCalledWith("reading-uuid-1", userId);
      expect(result.id).toBe("reading-uuid-1");
    });

    it("2. Throws ReadingNotFoundError when reading does not exist or belongs to another user", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(null);

      await expect(getReadingByIdUseCase.execute(otherUserId, "reading-uuid-1")).rejects.toThrow(
        ReadingNotFoundError,
      );
    });
  });

  describe("UpdateReadingUseCase", () => {
    it("1. Successfully updates glucose value", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(sampleReading);
      vi.mocked(readingRepository.update).mockImplementation(async (r) => r);

      const result = await updateUseCase.execute(userId, "reading-uuid-1", {
        glucoseValue: 155,
      });

      expect(result.glucoseValue).toBe(155);
      expect(readingRepository.update).toHaveBeenCalledTimes(1);
    });

    it("2. Successfully updates date and slot without collision", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(sampleReading);
      vi.mocked(readingRepository.countByUserIdAndDate).mockResolvedValue(0);
      vi.mocked(readingRepository.findByUserIdDateAndSlot).mockResolvedValue(null);
      vi.mocked(readingRepository.update).mockImplementation(async (r) => r);

      const result = await updateUseCase.execute(userId, "reading-uuid-1", {
        date: "2026-11-09",
        slot: ReadingSlotType.AFTER_LUNCH,
      });

      expect(result.date).toBe("2026-11-09");
      expect(result.slot).toBe(ReadingSlotType.AFTER_LUNCH);
    });

    it("3. Rejects updating to duplicate slot on target date", async () => {
      const collidingReading = Reading.create({
        id: "another-reading-id",
        userId,
        date: parseDateOnly("2026-11-10"),
        slot: ReadingSlotType.AFTER_LUNCH,
        value: GlucoseValue.create(110),
      });

      vi.mocked(readingRepository.findById).mockResolvedValue(sampleReading);
      vi.mocked(readingRepository.findByUserIdDateAndSlot).mockResolvedValue(collidingReading);

      await expect(
        updateUseCase.execute(userId, "reading-uuid-1", {
          slot: ReadingSlotType.AFTER_LUNCH,
        }),
      ).rejects.toThrow(DuplicateReadingSlotError);

      expect(readingRepository.update).not.toHaveBeenCalled();
    });

    it("4. Rejects updating to future date", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(sampleReading);

      await expect(
        updateUseCase.execute(userId, "reading-uuid-1", {
          date: "2099-12-31",
        }),
      ).rejects.toThrow(FutureDateError);
    });

    it("5. Throws ReadingNotFoundError when updating another user's reading", async () => {
      vi.mocked(readingRepository.findById).mockResolvedValue(null);

      await expect(
        updateUseCase.execute(otherUserId, "reading-uuid-1", {
          glucoseValue: 160,
        }),
      ).rejects.toThrow(ReadingNotFoundError);
    });
  });

  describe("DeleteReadingUseCase", () => {
    it("1. Successfully deletes own reading", async () => {
      vi.mocked(readingRepository.delete).mockResolvedValue(true);

      await deleteUseCase.execute(userId, "reading-uuid-1");

      expect(readingRepository.delete).toHaveBeenCalledWith("reading-uuid-1", userId);
    });

    it("2. Throws ReadingNotFoundError when reading does not exist or belongs to another user", async () => {
      vi.mocked(readingRepository.delete).mockResolvedValue(false);

      await expect(deleteUseCase.execute(otherUserId, "reading-uuid-1")).rejects.toThrow(
        ReadingNotFoundError,
      );
    });
  });
});
