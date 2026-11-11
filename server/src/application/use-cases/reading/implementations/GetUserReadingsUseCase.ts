import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { ReadingMapper } from "@application/mappers/ReadingMapper";
import { parseDateOnly } from "@domain/utils/dateUtils";
import { type IGetUserReadingsUseCase } from "../interfaces/IGetUserReadingsUseCase";

export class GetUserReadingsUseCase implements IGetUserReadingsUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, dateStr?: string): Promise<ReadingResponseDTO[]> {
    const date = dateStr ? parseDateOnly(dateStr) : undefined;
    const readings = await this._readingRepository.findByUserId(userId, date);

    return readings.map(ReadingMapper.toResponseDTO);
  }
}
