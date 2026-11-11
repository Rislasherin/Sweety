import { type Reading } from "@domain/entities/Reading";
import { ReadingResponseDTO } from "@application/dtos/reading/Response/ReadingResponseDTO";
import { formatDateOnly } from "@domain/utils/dateUtils";

export class ReadingMapper {
  static toResponseDTO(reading: Reading): ReadingResponseDTO {
    const response = new ReadingResponseDTO();
    response.id = reading.id;
    response.userId = reading.userId;
    response.date = formatDateOnly(reading.date);
    response.slot = reading.slot;
    response.glucoseValue = reading.value.getValue();
    response.createdAt = reading.createdAt;
    response.updatedAt = reading.updatedAt;
    return response;
  }
}
