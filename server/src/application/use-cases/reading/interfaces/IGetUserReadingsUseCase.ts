import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { type PaginationMeta } from "@shared/utils/response.util";

export interface PaginatedReadingsResponseDTO {
  readings: ReadingResponseDTO[];
  pagination: PaginationMeta;
}

export interface GetUserReadingsQuery {
  date?: string;
  page?: number;
  limit?: number;
}

export interface IGetUserReadingsUseCase {
  execute(
    userId: string,
    queryOrDate?: string | GetUserReadingsQuery,
  ): Promise<PaginatedReadingsResponseDTO>;
}
