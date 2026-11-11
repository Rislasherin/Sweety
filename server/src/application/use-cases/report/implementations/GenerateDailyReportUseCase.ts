import { type IGenerateDailyReportUseCase } from "../interfaces/IGenerateDailyReportUseCase";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import {
  type DailyReportResponseDTO,
  type DailyReportReadingItemDTO,
  ReportType,
} from "@application/dtos/report/Response/ReportResponseDTO";
import {
  parseDateOnly,
  formatDateOnly,
  assertNotFutureDate,
  getDailyDateRange,
  roundToOneDecimal,
} from "@domain/utils/dateUtils";

export class GenerateDailyReportUseCase implements IGenerateDailyReportUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, dateStr: string): Promise<DailyReportResponseDTO> {
    const selectedDate = parseDateOnly(dateStr);
    assertNotFutureDate(selectedDate);

    const range = getDailyDateRange(selectedDate);
    const readings = await this._readingRepository.findByUserId(userId, selectedDate);

    if (readings.length === 0) {
      return {
        reportType: ReportType.DAILY,
        startDate: range.startDateStr,
        endDate: range.endDateStr,
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
        readings: [],
      };
    }

    const values = readings.map((r) => r.value.getValue());
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const average = roundToOneDecimal(sum / values.length);

    const readingItems: DailyReportReadingItemDTO[] = readings.map((r) => ({
      id: r.id,
      date: formatDateOnly(r.date),
      slot: r.slot,
      glucoseValue: r.value.getValue(),
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      reportType: ReportType.DAILY,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      highest,
      lowest,
      average,
      count: readings.length,
      totalReadings: readings.length,
      hasData: true,
      readings: readingItems,
    };
  }
}
