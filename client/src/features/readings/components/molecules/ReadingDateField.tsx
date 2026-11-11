import React from 'react'
import { Input } from '@/components/atoms/Input'
import { Label } from '@/components/atoms/Label'
import { cn } from '@/utils/cn'
import { getTodayIsoString } from '@/utils/date'

export interface ReadingDateFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const ReadingDateField: React.FC<ReadingDateFieldProps> = ({
  id = 'reading-date-field',
  value,
  onChange,
  error,
  required = true,
  disabled = false,
  className,
}) => {
  const today = getTodayIsoString()

  return (
    <div className={cn('w-full', className)}>
      <Label htmlFor={id} required={required}>
        Reading Date
      </Label>

      <Input
        id={id}
        name="date"
        type="date"
        max={today}
        value={value}
        disabled={disabled}
        hasError={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? `${id}-error` : `${id}-helper`}
      />

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-slate-500">
          Select the date this reading was taken (today or past date).
        </p>
      )}
    </div>
  )
}
