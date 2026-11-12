import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { readingService } from '@/features/readings/services/readingService'
import { apiClient, getAccessToken, setAccessToken } from '@/lib/apiClient'
import { ApiError } from '@/lib/apiError'
import { mapApiErrorToFriendlyMessage } from '@/features/readings/utils/readingValidation'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '@/features/readings/types'

describe('readingsApiIntegration (readingService <-> apiClient)', () => {
  const originalAdapter = apiClient.defaults.adapter

  const sampleReading: Reading = {
    id: 'reading-integration-1',
    userId: 'user-uuid-1',
    date: '2026-11-12',
    slot: 'MORNING',
    glucoseValue: 115,
    createdAt: '2026-11-12T07:30:00.000Z',
    updatedAt: '2026-11-12T07:30:00.000Z',
  }

  function createHttpResponse<T>(
    data: T,
    config: InternalAxiosRequestConfig,
    status = 200
  ): AxiosResponse<T> {
    return {
      data,
      status,
      statusText: status === 201 ? 'Created' : 'OK',
      headers: {},
      config,
    }
  }

  function createHttpError(
    status: number,
    data: unknown,
    config: InternalAxiosRequestConfig,
    message = `Request failed with status code ${status}`
  ): AxiosError {
    const response: AxiosResponse = {
      data,
      status,
      statusText: status === 401 ? 'Unauthorized' : status === 409 ? 'Conflict' : 'Bad Request',
      headers: {},
      config,
    }
    return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, response)
  }

  function getAuthHeader(config: InternalAxiosRequestConfig): string | undefined {
    if (typeof (config.headers as { get?: (k: string) => string }).get === 'function') {
      return (config.headers as { get: (k: string) => string }).get('Authorization')
    }
    return (config.headers as Record<string, string>)['Authorization']
  }

  beforeEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    setAccessToken(null)
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('1. injects Authorization Bearer header using the in-memory access token', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null

    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config
      return createHttpResponse(
        {
          success: true,
          message: 'Readings retrieved successfully',
          data: [sampleReading],
        },
        config
      )
    }

    // When access token is set
    setAccessToken('in-memory-test-token-123')
    const result = await readingService.getReadings()

    expect(result).toEqual([sampleReading])
    expect(capturedConfig).not.toBeNull()
    expect(getAuthHeader(capturedConfig!)).toBe('Bearer in-memory-test-token-123')

    // When access token is null
    setAccessToken(null)
    await readingService.getReadings()
    expect(getAuthHeader(capturedConfig!)).toBeUndefined()
  })

  it('2. correctly serializes date-filter query parameter across requests', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null

    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config
      return createHttpResponse(
        {
          success: true,
          message: 'Filtered readings retrieved',
          data: [sampleReading],
        },
        config
      )
    }

    setAccessToken('valid-token')

    // Request with date filter
    await readingService.getReadings('2026-11-12')
    expect(capturedConfig).not.toBeNull()
    expect(capturedConfig!.url).toBe('/readings')
    expect(capturedConfig!.params).toEqual({ date: '2026-11-12' })

    // Request without date filter
    await readingService.getReadings()
    expect(capturedConfig!.params).toBeUndefined()
  })

  it('3 & 4. 401 response triggers /auth/refresh and successfully retries original readings request', async () => {
    setAccessToken('stale-access-token')

    let attemptCount = 0
    const capturedAuthHeaders: Array<string | undefined> = []

    apiClient.defaults.adapter = async (config) => {
      attemptCount++
      capturedAuthHeaders.push(getAuthHeader(config))

      if (attemptCount === 1) {
        // First request receives 401 from backend
        throw createHttpError(
          401,
          { success: false, message: 'Access token expired', error: { code: 'UNAUTHORIZED' } },
          config
        )
      }

      // Second request (retry) succeeds with updated token
      return createHttpResponse(
        {
          success: true,
          message: 'Readings retrieved after refresh',
          data: [sampleReading],
        },
        config
      )
    }

    // Mock the external HTTP boundary for /auth/refresh called by apiClient interceptor
    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Token rotated successfully',
        data: {
          token: 'refreshed-jwt-access-token',
          user: { id: 'user-uuid-1', name: 'Tester', email: 'tester@example.com' },
        },
      },
    })

    const readings = await readingService.getReadings()

    expect(readings).toEqual([sampleReading])
    expect(attemptCount).toBe(2)
    expect(capturedAuthHeaders[0]).toBe('Bearer stale-access-token')
    expect(capturedAuthHeaders[1]).toBe('Bearer refreshed-jwt-access-token')
    expect(getAccessToken()).toBe('refreshed-jwt-access-token')
    expect(refreshSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      expect.objectContaining({ withCredentials: true })
    )
  })

  it('5. failed refresh clears access token from memory and returns SESSION_EXPIRED error', async () => {
    setAccessToken('expired-access-token')

    apiClient.defaults.adapter = async (config) => {
      throw createHttpError(
        401,
        { success: false, message: 'Session expired', error: { code: 'UNAUTHORIZED' } },
        config
      )
    }

    // Refresh endpoint rejects (e.g. revoked refresh token)
    vi.spyOn(axios, 'post').mockRejectedValue(
      new AxiosError(
        'Revoked refresh token',
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        null,
        {
          status: 401,
          statusText: 'Unauthorized',
          data: { success: false, message: 'Invalid refresh token' },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        }
      )
    )

    await expect(readingService.getReadings()).rejects.toThrow(
      'Session expired. Please log in again.'
    )
    expect(getAccessToken()).toBeNull()
  })

  it('6. propagates 409 duplicate-slot errors and maps to user-friendly messages', async () => {
    setAccessToken('valid-token')

    apiClient.defaults.adapter = async (config) => {
      throw createHttpError(
        409,
        {
          success: false,
          message: 'A reading for this slot already exists on this date',
          error: { code: 'DUPLICATE_SLOT' },
        },
        config
      )
    }

    const payload: CreateReadingDTO = {
      date: '2026-11-12',
      slot: 'MORNING',
      glucoseValue: 120,
    }

    let caughtError: unknown = null
    try {
      await readingService.createReading(payload)
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(ApiError)
    const apiError = caughtError as ApiError
    expect(apiError.statusCode).toBe(409)
    expect(apiError.message).toBe('A reading for this slot already exists on this date')

    // Friendly error message translation
    const userMessage = mapApiErrorToFriendlyMessage(apiError)
    expect(userMessage).toBe(
      'A reading for this slot already exists on this date. Please choose another slot or edit the existing reading.'
    )
  })

  it('7. verifies full CRUD endpoints (POST, GET by ID, PATCH, DELETE) through real apiClient', async () => {
    setAccessToken('crud-test-token')
    const capturedCalls: Array<{ method: string; url: string; data?: unknown }> = []

    apiClient.defaults.adapter = async (config) => {
      const parsedData = config.data ? JSON.parse(config.data as string) : undefined
      capturedCalls.push({
        method: config.method?.toUpperCase() || 'GET',
        url: config.url || '',
        data: parsedData,
      })

      if (config.method?.toUpperCase() === 'POST') {
        return createHttpResponse(
          { success: true, message: 'Created', data: sampleReading },
          config,
          201
        )
      }
      if (config.method?.toUpperCase() === 'PATCH') {
        return createHttpResponse(
          {
            success: true,
            message: 'Updated',
            data: { ...sampleReading, glucoseValue: 130 },
          },
          config
        )
      }
      if (config.method?.toUpperCase() === 'DELETE') {
        return createHttpResponse({ success: true, message: 'Deleted', data: null }, config)
      }
      return createHttpResponse({ success: true, message: 'Found', data: sampleReading }, config)
    }

    // 1. Create reading
    const created = await readingService.createReading({
      date: '2026-11-12',
      slot: 'MORNING',
      glucoseValue: 115,
    })
    expect(created.id).toBe(sampleReading.id)

    // 2. Get reading by ID
    const single = await readingService.getReadingById('reading-integration-1')
    expect(single.id).toBe(sampleReading.id)

    // 3. Update reading
    const updatePayload: UpdateReadingDTO = { glucoseValue: 130 }
    const updated = await readingService.updateReading('reading-integration-1', updatePayload)
    expect(updated.glucoseValue).toBe(130)

    // 4. Delete reading
    await readingService.deleteReading('reading-integration-1')

    // Verify all 4 calls went through apiClient with correct endpoints and methods
    expect(capturedCalls).toHaveLength(4)
    expect(capturedCalls[0]).toEqual({
      method: 'POST',
      url: '/readings',
      data: { date: '2026-11-12', slot: 'MORNING', glucoseValue: 115 },
    })
    expect(capturedCalls[1]).toEqual({
      method: 'GET',
      url: '/readings/reading-integration-1',
      data: undefined,
    })
    expect(capturedCalls[2]).toEqual({
      method: 'PATCH',
      url: '/readings/reading-integration-1',
      data: { glucoseValue: 130 },
    })
    expect(capturedCalls[3]).toEqual({
      method: 'DELETE',
      url: '/readings/reading-integration-1',
      data: undefined,
    })
  })
})
