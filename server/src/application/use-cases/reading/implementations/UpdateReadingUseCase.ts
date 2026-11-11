import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type UpdateReadingRequestDTO } from "@application/dtos/reading/Request/UpdateReadingRequestDTO";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { parseDateOnly, assertNotFutureDate, formatDateOnly } from "@domain/utils/dateUtils";
import {
  DailyReadingLimitExceededError,
  DuplicateReadingSlotError,
  ReadingNotFoundError,
} from "@domain/errors/ReadingErrors";
import { ReadingMapper } from "@application/mappers/ReadingMapper";
import { type IUpdateReadingUseCase } from "../interfaces/IUpdateReadingUseCase";

export class UpdateReadingUseCase implements IUpdateReadingUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(
    userId: string,
    id: string,
    dto: UpdateReadingRequestDTO,
  ): Promise<ReadingResponseDTO> {
    const existing = await this._readingRepository.findById(id, userId);
    if (!existing) {
      throw new ReadingNotFoundError();
    }

    const targetDate = dto.date ? parseDateOnly(dto.date) : existing.date;
    if (dto.date) {
      assertNotFutureDate(targetDate);
    }

    const targetSlot = dto.slot ?? existing.slot;

    const dateChanged = formatDateOnly(targetDate) !== formatDateOnly(existing.date);
    const slotChanged = targetSlot !== existing.slot;

    if (dateChanged) {
      const count = await this._readingRepository.countByUserIdAndDate(userId, targetDate);
      if (count >= 4) {
        throw new DailyReadingLimitExceededError();
      }
    }

    if (dateChanged || slotChanged) {
      const collision = await this._readingRepository.findByUserIdDateAndSlot(
        userId,
        targetDate,
        targetSlot,
      );
      if (collision && collision.id !== existing.id) {
        throw new DuplicateReadingSlotError();
      }
    }

    const targetValue =
      dto.glucoseValue !== undefined ? GlucoseValue.create(dto.glucoseValue) : existing.value;

    const updatedReading = existing.update({
      date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });

    const saved = await this._readingRepository.update(updatedReading);

    return ReadingMapper.toResponseDTO(saved);
  }
}
