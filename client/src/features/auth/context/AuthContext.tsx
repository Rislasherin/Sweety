import React, { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setAccessToken } from '@/lib/apiClient'
import { AuthContext } from './authContextInstance'
import type {
  User,
  LoginRequestDTO,
  RegisterRequestDTO,
  RegisterResponseData,
  AuthContextType,
} from '../types'

const USER_KEY = 'sweety_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout()
    } catch {
      // Idempotent client logout
    }

    setAccessToken(null)
    setToken(null)
    setUser(null)

    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      // Storage access fail-safe
    }
  }, [])

  // Session restoration on startup via HttpOnly refresh cookie
  useEffect(() => {
    let isMounted = true

    authService
      .refresh()
      .then(({ token: newAccessToken, user: profile }) => {
        if (isMounted) {
          setAccessToken(newAccessToken)
          setToken(newAccessToken)
          setUser(profile)
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(profile))
          } catch {
            // Storage access fail-safe
          }
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccessToken(null)
          setToken(null)
          setUser(null)
          try {
            localStorage.removeItem(USER_KEY)
          } catch {
            // Storage access fail-safe
          }
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { token: newAccessToken, user: profile } = await authService.refresh()
      setAccessToken(newAccessToken)
      setToken(newAccessToken)
      setUser(profile)
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(profile))
      } catch {
        // Storage access fail-safe
      }
    } catch {
      await logout()
    }
  }, [logout])

  const login = useCallback(async (credentials: LoginRequestDTO): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      const { token: receivedToken, id, name, email } = response
      const userData: User = { id, name, email }

      setAccessToken(receivedToken)
      setToken(receivedToken)
      setUser(userData)

      try {
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      } catch {
        // Storage access fail-safe
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (credentials: RegisterRequestDTO): Promise<RegisterResponseData> => {
      setIsLoading(true)
      try {
        return await authService.register(credentials)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
