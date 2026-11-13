import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '@/components/organisms/Header'
import { HomePage } from '@/features/home/pages/HomePage'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { readingService, type PaginatedReadingsResponse } from '@/features/readings/services/readingService'
import type { Reading } from '@/features/readings/types'
import { getTodayIsoString } from '@/utils/date'

// Mock useAuth
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

describe('Professional UI & Navigation Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockLoggedOutAuth = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }

  describe('Global Header & Navigation', () => {
    it('renders brand identity and desktop navigation links', () => {
      vi.mocked(useAuth).mockReturnValue(mockLoggedOutAuth)

      render(
        <MemoryRouter initialEntries={['/']}>
          <Header apiStatus="online" />
        </MemoryRouter>
      )

      expect(screen.getByText('Sweety')).toBeInTheDocument()
      expect(screen.getByText('Glucose Tracker')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /readings/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument()
    })

    it('does NOT render developer API Online status badge in normal header view', () => {
      vi.mocked(useAuth).mockReturnValue(mockLoggedOutAuth)

      render(
        <MemoryRouter initialEntries={['/']}>
          <Header apiStatus="online" />
        </MemoryRouter>
      )

      expect(screen.queryByText('API Online')).not.toBeInTheDocument()
      expect(screen.queryByText('API Offline')).not.toBeInTheDocument()
    })

    it('toggles mobile navigation drawer when clicking the hamburger button', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue(mockLoggedOutAuth)

      render(
        <MemoryRouter initialEntries={['/']}>
          <Header apiStatus="online" />
        </MemoryRouter>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Mobile nav links are now rendered inside mobile navigation container
      const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i })
      expect(mobileNav).toBeInTheDocument()

      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument()
    })
  })

  describe('Refined Home Page (Personal Health Overview)', () => {
    it('renders welcoming patient overview and does not render developer artifacts', async () => {
      const today = getTodayIsoString()
      const mockReadings: Reading[] = [
        {
          id: 'r-1',
          userId: 'u-1',
          date: today,
          slot: 'MORNING',
          glucoseValue: 92,
          createdAt: `${today}T07:30:00.000Z`,
          updatedAt: `${today}T07:30:00.000Z`,
        },
      ]

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'u-1', email: 'demo@sweety.local', name: 'Demo Patient' },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      })

      vi.spyOn(readingService, 'getReadings').mockResolvedValue(
        mockReadings as unknown as PaginatedReadingsResponse
      )

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/welcome back, demo patient/i)).toBeInTheDocument()
        expect(screen.getByText("Today's Snapshot")).toBeInTheDocument()
      })

      // Must NOT contain developer-oriented banners or controls
      expect(screen.queryByText(/backend api connected/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/test backend connection/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/module 01/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/module 02/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/module 03/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/atomic ui foundation/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/session active & isolated/i)).not.toBeInTheDocument()
    })
  })
})

