import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { ReadingNotFoundError } from "@domain/errors/ReadingErrors";
import { type IDeleteReadingUseCase } from "../interfaces/IDeleteReadingUseCase";

export class DeleteReadingUseCase implements IDeleteReadingUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const deleted = await this._readingRepository.delete(id, userId);

    if (!deleted) {
      throw new ReadingNotFoundError();
    }
  }
}
