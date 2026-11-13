import React, { useId } from 'react'
import { Label } from '../atoms/Label'
import { Input, type InputProps } from '../atoms/Input'
import { cn } from '@/utils/cn'

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, required, containerClassName, className, ...inputProps }, ref) => {
    const generatedId = useId()
    const inputId = inputProps.name || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          id={inputId}
          hasError={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={className}
          {...inputProps}
        />
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

FormField.displayName = 'FormField'
