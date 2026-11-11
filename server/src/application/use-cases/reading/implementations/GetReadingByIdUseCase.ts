import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { ReadingMapper } from "@application/mappers/ReadingMapper";
import { ReadingNotFoundError } from "@domain/errors/ReadingErrors";
import { type IGetReadingByIdUseCase } from "../interfaces/IGetReadingByIdUseCase";

export class GetReadingByIdUseCase implements IGetReadingByIdUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, id: string): Promise<ReadingResponseDTO> {
    const reading = await this._readingRepository.findById(id, userId);

    if (!reading) {
      throw new ReadingNotFoundError();
    }

    return ReadingMapper.toResponseDTO(reading);
  }
}
