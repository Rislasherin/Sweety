import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";

export interface IGetReadingByIdUseCase {
  execute(userId: string, id: string): Promise<ReadingResponseDTO>;
}
