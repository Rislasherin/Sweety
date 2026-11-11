import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/types/api.types'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../types'

export const readingService = {
  /**
   * Fetch all glucose readings for the authenticated user, optionally filtered by date.
   * Responses are ordered by date DESC, slot in standard order (MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER).
   */
  async getReadings(date?: string): Promise<Reading[]> {
    const params = date ? { date } : undefined
    const response = await apiClient.get<ApiResponse<Reading[]>>('/readings', { params })
    return response.data.data
  },

  /**
   * Fetch a single reading by its ID.
   */
  async getReadingById(id: string): Promise<Reading> {
    const response = await apiClient.get<ApiResponse<Reading>>(`/readings/${id}`)
    return response.data.data
  },

  /**
   * Create a new glucose reading.
   */
  async createReading(dto: CreateReadingDTO): Promise<Reading> {
    const response = await apiClient.post<ApiResponse<Reading>>('/readings', dto)
    return response.data.data
  },

  /**
   * Update an existing glucose reading.
   */
  async updateReading(id: string, dto: UpdateReadingDTO): Promise<Reading> {
    const response = await apiClient.patch<ApiResponse<Reading>>(`/readings/${id}`, dto)
    return response.data.data
  },

  /**
   * Delete an existing glucose reading.
   */
  async deleteReading(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/readings/${id}`)
  },
}
