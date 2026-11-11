import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { PasswordField } from '@/components/molecules/PasswordField'
import { Alert } from '@/components/molecules/Alert'
import { useAuth } from '../hooks/useAuth'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation'
import { ApiError } from '@/lib/apiError'
import type { SignupFormValues } from '../types'

export interface SignupFormProps {
  onSuccess?: () => void
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState<SignupFormValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleChange =
    (field: keyof SignupFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
      if (formError) {
        setFormError(null)
      }
    }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SignupFormValues, string>> = {}

    const nameError = validateName(values.name)
    if (nameError) newErrors.name = nameError

    const emailError = validateEmail(values.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(values.password)
    if (passwordError) newErrors.password = passwordError

    const confirmError = validateConfirmPassword(values.password, values.confirmPassword)
    if (confirmError) newErrors.confirmPassword = confirmError

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
      await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/login', {
          replace: true,
          state: {
            registeredMessage: 'Registration successful! Please sign in with your credentials.',
          },
        })
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409 || err.code === 'RESOURCE_ALREADY_EXISTS') {
          setFormError('A user with this email address already exists. Please sign in instead.')
        } else if (err.isValidationError() && Array.isArray(err.details)) {
          // Field-level backend errors
          const backendFieldErrors: Partial<Record<keyof SignupFormValues, string>> = {}
          err.details.forEach((d) => {
            if (d && typeof d === 'object' && 'field' in d && 'message' in d) {
              const fieldName = (d as { field: string }).field as keyof SignupFormValues
              backendFieldErrors[fieldName] = (d as { message: string }).message
            }
          })
          setErrors(backendFieldErrors)
          setFormError('Please correct the highlighted fields.')
        } else {
          setFormError(err.message || 'Registration failed. Please try again.')
        }
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('An unexpected error occurred during registration.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <Alert variant="danger" title="Registration Error" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <FormField
        label="Full Name"
        type="text"
        name="name"
        autoComplete="name"
        required
        value={values.name}
        onChange={handleChange('name')}
        error={errors.name}
        placeholder="Jane Doe"
        disabled={isSubmitting}
      />

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
        autoComplete="new-password"
        required
        value={values.password}
        onChange={handleChange('password')}
        error={errors.password}
        helperText="Minimum 8 characters"
        placeholder="Create a secure password"
        disabled={isSubmitting}
      />

      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
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
        Create Account
      </Button>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
