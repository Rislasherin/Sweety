import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/features/auth/services/authService'
import { apiClient } from '@/lib/apiClient'
import { ApiError } from '@/lib/apiError'

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('register calls POST /auth/register and returns response data', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User registered successfully',
        data: {
          id: 'user-123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: '2026-11-11T12:00:00.000Z',
        },
      },
    }

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse)

    const result = await authService.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    })
    expect(result.id).toBe('user-123')
    expect(result.name).toBe('Jane Doe')
    expect(result.email).toBe('jane@example.com')
  })

  it('login calls POST /auth/login and returns response data with token', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Login successful',
        data: {
          id: 'user-123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          token: 'jwt-token-xyz',
        },
      },
    }

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse)

    const result = await authService.login({
      email: 'jane@example.com',
      password: 'password123',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'jane@example.com',
      password: 'password123',
    })
    expect(result.token).toBe('jwt-token-xyz')
    expect(result.email).toBe('jane@example.com')
  })

  it('getMe calls GET /auth/me and returns current user profile', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Current user profile retrieved',
        data: {
          id: 'user-123',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
    }

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse)

    const profile = await authService.getMe()

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me')
    expect(profile.id).toBe('user-123')
    expect(profile.name).toBe('Jane Doe')
  })

  it('refresh calls POST /auth/refresh and returns new token and user', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: 'rotated-access-token',
          user: {
            id: 'user-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
          },
        },
      },
    }

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse)

    const result = await authService.refresh()

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh')
    expect(result.token).toBe('rotated-access-token')
    expect(result.user.email).toBe('jane@example.com')
  })

  it('logout calls POST /auth/logout', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true } })

    await authService.logout()

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('propagates ApiError when API returns 401 Unauthorized', async () => {
    const apiError = new ApiError({
      message: 'Invalid email or password',
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    })

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(apiError)

    await expect(
      authService.login({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Invalid email or password')
  })

  it('propagates ApiError when API returns 409 Conflict (duplicate email)', async () => {
    const apiError = new ApiError({
      message: 'A user with this email already exists',
      statusCode: 409,
      code: 'RESOURCE_ALREADY_EXISTS',
    })

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(apiError)

    await expect(
      authService.register({
        name: 'Existing User',
        email: 'exists@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('A user with this email already exists')
  })

  it('recovers from a transient concurrent refresh race by retrying once', async () => {
    const concurrencyError = new ApiError({
      message: 'Refresh request already in progress',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    })

    const successfulRetryResponse = {
      data: {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: 'recovered-access-token',
          user: {
            id: 'user-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
          },
        },
      },
    }

    vi.spyOn(apiClient, 'post')
      .mockRejectedValueOnce(concurrencyError)
      .mockResolvedValueOnce(successfulRetryResponse)

    const result = await authService.refresh()

    expect(apiClient.post).toHaveBeenCalledTimes(2)
    expect(result.token).toBe('recovered-access-token')
  })

  it('refresh terminates without infinite loop when recovery retry fails', async () => {
    const error = new ApiError({
      message: 'Session expired',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    })

    vi.spyOn(apiClient, 'post').mockRejectedValue(error)

    await expect(authService.refresh()).rejects.toThrow('Session expired')
    expect(apiClient.post).toHaveBeenCalledTimes(2) // Exactly 2 calls: initial + 1 single retry, strictly capped
  })
})
