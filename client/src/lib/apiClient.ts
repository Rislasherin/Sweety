import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse, ApiResponse } from '@/types/api.types'
import type { User } from '@/features/auth/types'
import { ApiError } from './apiError'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// In-memory access token storage (never persisted in localStorage)
let inMemoryAccessToken: string | null = null

export const getAccessToken = (): string | null => inMemoryAccessToken

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Always include HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: attach bearer token from memory if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Shared refresh state and subscriber queue to prevent concurrent refresh storms
let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// Response interceptor: handle 401 with automatic token refresh queue & retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message: error.message || 'Network error. Please check your connection.',
          statusCode: 0,
          code: 'NETWORK_ERROR',
          isNetworkError: true,
        })
      )
    }

    const { status, data } = error.response

    const url = originalRequest?.url || ''
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')

    // Eligible 401 retry: protected endpoint, not already retried
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string | null) => {
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(apiClient(originalRequest))
            } else {
              reject(
                new ApiError({
                  message: 'Session expired. Please log in again.',
                  statusCode: 401,
                  code: 'UNAUTHORIZED',
                  isNetworkError: false,
                })
              )
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        let refreshResponse: { data: ApiResponse<{ token: string; user: User }> } | null = null

        try {
          refreshResponse = await axios.post<ApiResponse<{ token: string; user: User }>>(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
        } catch {
          // If a concurrent refresh was in flight in another tab, pause briefly for that
          // tab to write the new cookie into the browser jar, then attempt exactly one recovery retry.
          await new Promise((resolve) => setTimeout(resolve, 150))
          refreshResponse = await axios.post<ApiResponse<{ token: string; user: User }>>(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
        }

        const newAccessToken = refreshResponse.data.data.token
        setAccessToken(newAccessToken)
        onRefreshed(newAccessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return apiClient(originalRequest)
      } catch {
        setAccessToken(null)
        onRefreshed(null)
        return Promise.reject(
          new ApiError({
            message: 'Session expired. Please log in again.',
            statusCode: 401,
            code: 'SESSION_EXPIRED',
            isNetworkError: false,
          })
        )
      } finally {
        isRefreshing = false
      }
    }

    const message = data?.message || error.message || 'An unexpected error occurred.'
    const code = data?.error?.code || `HTTP_${status}`
    const details = data?.error?.details

    return Promise.reject(
      new ApiError({
        message,
        statusCode: status,
        code,
        details,
        isNetworkError: false,
      })
    )
  }
)
