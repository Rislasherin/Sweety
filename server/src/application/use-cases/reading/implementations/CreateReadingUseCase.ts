import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type CreateReadingRequestDTO } from "@application/dtos/reading/Request/CreateReadingRequestDTO";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { Reading } from "@domain/entities/Reading";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { parseDateOnly, assertNotFutureDate } from "@domain/utils/dateUtils";
import {
  DailyReadingLimitExceededError,
  DuplicateReadingSlotError,
} from "@domain/errors/ReadingErrors";
import { ReadingMapper } from "@application/mappers/ReadingMapper";
import { type ICreateReadingUseCase } from "../interfaces/ICreateReadingUseCase";

export class CreateReadingUseCase implements ICreateReadingUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, dto: CreateReadingRequestDTO): Promise<ReadingResponseDTO> {
    const date = parseDateOnly(dto.date);
    assertNotFutureDate(date);

    const glucoseValue = GlucoseValue.create(dto.glucoseValue);

    const count = await this._readingRepository.countByUserIdAndDate(userId, date);
    if (count >= 4) {
      throw new DailyReadingLimitExceededError();
    }

    const existingSlot = await this._readingRepository.findByUserIdDateAndSlot(
      userId,
      date,
      dto.slot,
    );
    if (existingSlot) {
      throw new DuplicateReadingSlotError();
    }

    const reading = Reading.create({
      userId,
      date,
      slot: dto.slot,
      value: glucoseValue,
    });

    const saved = await this._readingRepository.save(reading);

    return ReadingMapper.toResponseDTO(saved);
  }
}
