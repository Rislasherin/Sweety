import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { ReadingMapper } from "@application/mappers/ReadingMapper";
import { parseDateOnly } from "@domain/utils/dateUtils";
import {
  type IGetUserReadingsUseCase,
  type GetUserReadingsQuery,
  type PaginatedReadingsResponseDTO,
} from "../interfaces/IGetUserReadingsUseCase";

export class GetUserReadingsUseCase implements IGetUserReadingsUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(
    userId: string,
    queryOrDate?: string | GetUserReadingsQuery,
  ): Promise<PaginatedReadingsResponseDTO> {
    const query: GetUserReadingsQuery =
      typeof queryOrDate === "string" ? { date: queryOrDate } : (queryOrDate ?? {});

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const date = query.date ? parseDateOnly(query.date) : undefined;

    let readingsDomain;
    let total: number;

    if (typeof this._readingRepository.findPaginatedByUserId === "function") {
      const paginatedResult = await this._readingRepository.findPaginatedByUserId(userId, {
        date,
        page,
        limit,
      });
      readingsDomain = paginatedResult.readings;
      total = paginatedResult.total;
    } else {
      const allReadings = await this._readingRepository.findByUserId(userId, date);
      total = allReadings.length;
      const skip = (page - 1) * limit;
      readingsDomain = allReadings.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const readings: ReadingResponseDTO[] = readingsDomain.map(ReadingMapper.toResponseDTO);

    return {
      readings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        hasNext: hasNextPage,
        hasPrev: hasPreviousPage,
      },
    };
  }
}
