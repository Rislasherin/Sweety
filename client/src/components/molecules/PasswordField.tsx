import { forwardRef, useState, useId } from 'react'
import { Label } from '../atoms/Label'
import { Input, type InputProps } from '../atoms/Input'
import { cn } from '@/utils/cn'

export interface PasswordFieldProps extends Omit<InputProps, 'type' | 'id'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label = 'Password',
      error,
      helperText,
      required,
      containerClassName,
      className,
      ...inputProps
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const generatedId = useId()
    const inputId = inputProps.name || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center w-full">
          <Input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            hasError={Boolean(error)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn('pr-10', className)}
            {...inputProps}
          />
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors cursor-pointer"
          >
            {showPassword ? (
              // Eye-off icon
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              // Eye icon
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-rose-600 font-medium" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

PasswordField.displayName = 'PasswordField'
