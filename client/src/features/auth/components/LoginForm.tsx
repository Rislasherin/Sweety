import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { PasswordField } from '@/components/molecules/PasswordField'
import { Alert } from '@/components/molecules/Alert'
import { useAuth } from '../hooks/useAuth'
import { validateEmail, validatePassword } from '../utils/validation'
import { ApiError } from '@/lib/apiError'
import type { LoginFormValues } from '../types'

export interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Success message passed from registration navigation state
  const registrationSuccessMessage = (location.state as { registeredMessage?: string } | null)
    ?.registeredMessage

  const handleChange =
    (field: keyof LoginFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
      if (formError) {
        setFormError(null)
      }
    }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LoginFormValues, string>> = {}

    const emailError = validateEmail(values.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(values.password)
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setFormError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        const fromPath =
          (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/'
        navigate(fromPath, { replace: true })
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          setFormError('Invalid email or password. Please try again.')
        } else {
          setFormError(err.message || 'Login failed. Please check your connection and try again.')
        }
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('An unexpected error occurred during login.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {registrationSuccessMessage && !formError && (
        <Alert variant="success" title="Account Created">
          {registrationSuccessMessage}
        </Alert>
      )}

      {formError && (
        <Alert variant="danger" title="Authentication Error" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <FormField
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={handleChange('email')}
        error={errors.email}
        placeholder="you@example.com"
        disabled={isSubmitting}
      />

      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        value={values.password}
        onChange={handleChange('password')}
        error={errors.password}
        placeholder="Enter your password"
        disabled={isSubmitting}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        className="w-full mt-2"
      >
        Sign In
      </Button>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </form>
  )
}
