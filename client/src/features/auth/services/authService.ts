import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/types/api.types'
import type {
  LoginRequestDTO,
  LoginResponseData,
  RegisterRequestDTO,
  RegisterResponseData,
  User,
} from '../types'

export const authService = {
  async register(payload: RegisterRequestDTO): Promise<RegisterResponseData> {
    const response = await apiClient.post<ApiResponse<RegisterResponseData>>(
      '/auth/register',
      payload
    )
    return response.data.data
  },

  async login(payload: LoginRequestDTO): Promise<LoginResponseData> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', payload)
    return response.data.data
  },

  async refresh(isRetry = false): Promise<{ token: string; user: User }> {
    try {
      const response =
        await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/refresh')
      return response.data.data
    } catch (error) {
      if (!isRetry) {
        // Recover from a concurrent rotation race in another tab by waiting briefly and retrying once
        await new Promise((resolve) => setTimeout(resolve, 150))
        return this.refresh(true)
      }
      throw error
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },
}
