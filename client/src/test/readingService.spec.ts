import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readingService } from '../features/readings/services/readingService'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../features/readings/types'
import { apiClient } from '../lib/apiClient'

describe('readingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockReading: Reading = {
    id: 'reading-123',
    userId: 'user-456',
    date: '2026-11-11',
    slot: 'MORNING',
    glucoseValue: 95,
    createdAt: '2026-11-11T08:00:00.000Z',
    updatedAt: '2026-11-11T08:00:00.000Z',
  }

  it('getReadings fetches all readings when no date filter is passed', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Readings retrieved successfully',
        data: [mockReading],
      },
    }
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse)

    const result = await readingService.getReadings()

    expect(apiClient.get).toHaveBeenCalledWith('/readings', { params: undefined })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('reading-123')
  })

  it('getReadings passes date parameter when filter is specified', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Readings retrieved successfully',
        data: [mockReading],
      },
    }
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse)

    const result = await readingService.getReadings('2026-11-11')

    expect(apiClient.get).toHaveBeenCalledWith('/readings', {
      params: { date: '2026-11-11' },
    })
    expect(result).toEqual([mockReading])
  })

  it('getReadings supports pagination parameters and returns pagination metadata', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Readings retrieved successfully',
        data: [mockReading],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      },
    }
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse)

    const result = await readingService.getReadings({ page: 2, limit: 10, date: '2026-11-11' })

    expect(apiClient.get).toHaveBeenCalledWith('/readings', {
      params: { date: '2026-11-11', page: 2, limit: 10 },
    })
    expect(result).toHaveLength(1)
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    })
  })

  it('getReadingById fetches single reading by ID', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Reading retrieved successfully',
        data: mockReading,
      },
    }
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse)

    const result = await readingService.getReadingById('reading-123')

    expect(apiClient.get).toHaveBeenCalledWith('/readings/reading-123')
    expect(result.id).toBe('reading-123')
    expect(result.glucoseValue).toBe(95)
  })

  it('createReading posts payload and returns created reading', async () => {
    const payload: CreateReadingDTO = {
      date: '2026-11-11',
      slot: 'AFTER_BREAKFAST',
      glucoseValue: 115,
    }
    const createdReading: Reading = {
      ...mockReading,
      id: 'reading-new',
      slot: 'AFTER_BREAKFAST',
      glucoseValue: 115,
    }
    const mockResponse = {
      data: {
        success: true,
        message: 'Reading created successfully',
        data: createdReading,
      },
    }
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse)

    const result = await readingService.createReading(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/readings', payload)
    expect(result.id).toBe('reading-new')
    expect(result.slot).toBe('AFTER_BREAKFAST')
    expect(result.glucoseValue).toBe(115)
  })

  it('updateReading patches payload and returns updated reading', async () => {
    const payload: UpdateReadingDTO = {
      glucoseValue: 105,
    }
    const updatedReading: Reading = {
      ...mockReading,
      glucoseValue: 105,
    }
    const mockResponse = {
      data: {
        success: true,
        message: 'Reading updated successfully',
        data: updatedReading,
      },
    }
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockResponse)

    const result = await readingService.updateReading('reading-123', payload)

    expect(apiClient.patch).toHaveBeenCalledWith('/readings/reading-123', payload)
    expect(result.glucoseValue).toBe(105)
  })

  it('deleteReading sends DELETE request with ID', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Reading deleted successfully',
        data: null,
      },
    }
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(mockResponse)

    await readingService.deleteReading('reading-123')

    expect(apiClient.delete).toHaveBeenCalledWith('/readings/reading-123')
  })
})
