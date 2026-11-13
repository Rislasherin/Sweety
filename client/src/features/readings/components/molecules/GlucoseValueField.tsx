import React from 'react'
import { Input } from '@/components/atoms/Input'
import { Label } from '@/components/atoms/Label'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/utils/cn'
import { getCategoryVariant, getGlucoseCategory } from '@/utils/formatters'

export interface GlucoseValueFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const GlucoseValueField: React.FC<GlucoseValueFieldProps> = ({
  id = 'glucose-value-field',
  value,
  onChange,
  error,
  required = true,
  disabled = false,
  className,
}) => {
  const numValue = Number(value)
  const isValidNum =
    !Number.isNaN(numValue) && numValue >= 40 && numValue <= 600 && !value.includes('.')
  const category = isValidNum ? getGlucoseCategory(numValue) : null
  const variant = category ? getCategoryVariant(category) : null

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={id} required={required}>
          Blood Glucose Value
        </Label>
        {category && variant && (
          <Badge variant={variant} size="sm" dot>
            {category.charAt(0) + category.slice(1).toLowerCase()}
          </Badge>
        )}
      </div>

      <Input
        id={id}
        name="glucoseValue"
        type="number"
        min={40}
        max={600}
        step={1}
        placeholder="e.g. 110"
        value={value}
        disabled={disabled}
        hasError={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        rightIcon={<span className="text-xs font-semibold text-slate-400">mg/dL</span>}
        aria-describedby={error ? `${id}-error` : `${id}-helper`}
      />

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-slate-500">
          Enter a whole number between 40 and 600 mg/dL.
        </p>
      )}
    </div>
  )
}
