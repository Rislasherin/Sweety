import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";

export interface IGetUserReadingsUseCase {
  execute(userId: string, dateStr?: string): Promise<ReadingResponseDTO[]>;
}
