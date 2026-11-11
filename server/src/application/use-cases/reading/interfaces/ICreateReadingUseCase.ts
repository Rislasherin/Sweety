import { type CreateReadingRequestDTO } from "@application/dtos/reading/Request/CreateReadingRequestDTO";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";

export interface ICreateReadingUseCase {
  execute(userId: string, dto: CreateReadingRequestDTO): Promise<ReadingResponseDTO>;
}
