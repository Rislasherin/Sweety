import { apiClient } from '@/lib/apiClient'
import type { ApiResponse, PaginationMeta } from '@/types/api.types'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../types'

export interface GetReadingsParams {
  date?: string
  page?: number
  limit?: number
}

export interface PaginatedReadingsResponse extends Array<Reading> {
  readings?: Reading[]
  pagination?: PaginationMeta
}

export const readingService = {
  /**
   * Fetch glucose readings for the authenticated user with pagination and optional date filter.
   * Responses are ordered by date DESC, slot in standard order (MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER).
   */
  async getReadings(
    query?: string | GetReadingsParams
  ): Promise<PaginatedReadingsResponse> {
    let params: Record<string, unknown> | undefined
    if (typeof query === 'string') {
      params = query ? { date: query } : undefined
    } else if (query) {
      params = {
        ...(query.date ? { date: query.date } : {}),
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
      }
      if (Object.keys(params).length === 0) {
        params = undefined
      }
    }

    const response = await apiClient.get<ApiResponse<Reading[]>>('/readings', { params })
    const items = response.data.data ?? []
    const requestedPage = typeof query === 'object' && query?.page ? query.page : 1
    const requestedLimit = typeof query === 'object' && query?.limit ? query.limit : 20

    const pagination: PaginationMeta = response.data.pagination ?? {
      page: requestedPage,
      limit: requestedLimit,
      total: items.length,
      totalPages: Math.ceil(items.length / requestedLimit) || 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }

    const result = [...items] as PaginatedReadingsResponse
    Object.defineProperties(result, {
      readings: {
        value: items,
        enumerable: false,
        writable: true,
        configurable: true,
      },
      pagination: {
        value: pagination,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    })

    return result
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
