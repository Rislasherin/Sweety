import { type UpdateReadingRequestDTO } from "@application/dtos/reading/Request/UpdateReadingRequestDTO";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";

export interface IUpdateReadingUseCase {
  execute(userId: string, id: string, dto: UpdateReadingRequestDTO): Promise<ReadingResponseDTO>;
}
