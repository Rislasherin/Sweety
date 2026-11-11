import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { PasswordField } from '@/components/molecules/PasswordField'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { authService } from '@/features/auth/services/authService'
import { ApiError } from '@/lib/apiError'

describe('Authentication Flow & UI Components', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('PasswordField Molecule', () => {
    it('toggles password visibility when clicking the eye button', async () => {
      const user = userEvent.setup()
      render(<PasswordField label="Secret" name="test-pwd" />)

      const input = screen.getByLabelText(/secret/i) as HTMLInputElement
      const toggleBtn = screen.getByRole('button', { name: /show password/i })

      expect(input.type).toBe('password')

      await user.click(toggleBtn)

      expect(input.type).toBe('text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /hide password/i }))
      expect(input.type).toBe('password')
    })
  })

  describe('LoginForm', () => {
    it('displays validation errors when submitting empty fields', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      )

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('displays validation error for malformed email format', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid-email-address')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('displays API error alert when login fails with invalid credentials', async () => {
      const user = userEvent.setup()
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        new ApiError({
          message: 'Invalid email or password',
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
        })
      )

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'WrongPassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('SignupForm', () => {
    it('validates required fields on submission', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <SignupForm />
          </AuthProvider>
        </MemoryRouter>
      )

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('rejects passwords shorter than 8 characters', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <AuthProvider>
            <SignupForm />
          </AuthProvider>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/^password/i), '123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })

    it('rejects mismatched password and confirm password', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <AuthProvider>
            <SignupForm />
          </AuthProvider>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })

    it('displays error alert for duplicate email address (409 Conflict)', async () => {
      const user = userEvent.setup()
      vi.spyOn(authService, 'register').mockRejectedValueOnce(
        new ApiError({
          message: 'A user with this email already exists',
          statusCode: 409,
          code: 'RESOURCE_ALREADY_EXISTS',
        })
      )

      render(
        <MemoryRouter>
          <AuthProvider>
            <SignupForm />
          </AuthProvider>
        </MemoryRouter>
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(
          screen.getByText('A user with this email address already exists. Please sign in instead.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Route Protection', () => {
    it('ProtectedRoute redirects unauthenticated visitors to /login', async () => {
      render(
        <MemoryRouter initialEntries={['/readings']}>
          <AuthProvider>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/readings" element={<div>Protected Readings Page</div>} />
              </Route>
              <Route path="/login" element={<div>Login Screen Destination</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Login Screen Destination')).toBeInTheDocument()
        expect(screen.queryByText('Protected Readings Page')).not.toBeInTheDocument()
      })
    })

    it('PublicOnlyRoute allows unauthenticated visitors to access /login', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<div>Public Login Page</div>} />
              </Route>
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Public Login Page')).toBeInTheDocument()
      })
    })
  })
})
