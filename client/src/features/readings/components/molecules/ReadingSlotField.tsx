import React from 'react'
import { Label } from '@/components/atoms/Label'
import { Select } from '@/components/atoms/Select'
import { cn } from '@/utils/cn'
import type { ReadingSlotType } from '../../types'
import { getReadingSlotDescription, READING_SLOT_OPTIONS } from '../../utils/readingValidation'

export interface ReadingSlotFieldProps {
  id?: string
  value: ReadingSlotType | ''
  onChange: (value: ReadingSlotType) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const ReadingSlotField: React.FC<ReadingSlotFieldProps> = ({
  id = 'reading-slot-field',
  value,
  onChange,
  error,
  required = true,
  disabled = false,
  className,
}) => {
  const selectedDescription = value ? getReadingSlotDescription(value) : ''

  return (
    <div className={cn('w-full', className)}>
      <Label htmlFor={id} required={required}>
        Reading Slot
      </Label>

      <Select
        id={id}
        name="slot"
        value={value}
        disabled={disabled}
        hasError={Boolean(error)}
        onChange={(e) => onChange(e.target.value as ReadingSlotType)}
        aria-describedby={error ? `${id}-error` : `${id}-helper`}
      >
        <option value="" disabled>
          Select meal slot...
        </option>
        {READING_SLOT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} — {opt.description}
          </option>
        ))}
      </Select>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-slate-500">
          {selectedDescription || 'One reading is permitted per slot on any calendar date.'}
        </p>
      )}
    </div>
  )
}
