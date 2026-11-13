import { describe, it, expect } from 'vitest'
import { ApiError } from '@/lib/apiError'

describe('ApiError class', () => {
  it('instantiates correctly with default code and status', () => {
    const error = new ApiError({ message: 'Something went wrong' })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('Something went wrong')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.isNetworkError).toBe(false)
  })

  it('correctly reports 401 Unauthorized', () => {
    const error = new ApiError({
      message: 'Invalid credentials',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    })

    expect(error.isUnauthorized()).toBe(true)
    expect(error.isForbidden()).toBe(false)
    expect(error.isNotFound()).toBe(false)
    expect(error.isValidationError()).toBe(false)
  })

  it('correctly reports 403 Forbidden', () => {
    const error = new ApiError({
      message: 'Access denied',
      statusCode: 403,
      code: 'FORBIDDEN',
    })

    expect(error.isForbidden()).toBe(true)
    expect(error.isUnauthorized()).toBe(false)
  })

  it('correctly reports 404 Not Found', () => {
    const error = new ApiError({
      message: 'Reading not found',
      statusCode: 404,
      code: 'NOT_FOUND',
    })

    expect(error.isNotFound()).toBe(true)
  })

  it('correctly reports 400 Validation Error with details', () => {
    const details = [{ field: 'glucoseValue', message: 'Must be positive' }]
    const error = new ApiError({
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    })

    expect(error.isValidationError()).toBe(true)
    expect(error.details).toEqual(details)
  })

  it('identifies network failures', () => {
    const error = new ApiError({
      message: 'Network offline',
      statusCode: 0,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    })

    expect(error.isNetworkError).toBe(true)
  })
})
