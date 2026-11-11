import React, { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Alert } from '@/components/molecules/Alert'
import { getTodayIsoString } from '@/utils/date'
import type {
  CreateReadingDTO,
  Reading,
  ReadingFormData,
  ReadingFormErrors,
  ReadingSlotType,
  UpdateReadingDTO,
} from '../../types'
import { validateReadingForm } from '../../utils/readingValidation'
import { GlucoseValueField } from '../molecules/GlucoseValueField'
import { ReadingDateField } from '../molecules/ReadingDateField'
import { ReadingSlotField } from '../molecules/ReadingSlotField'

export interface ReadingFormProps {
  initialReading?: Reading | null
  isLoading?: boolean
  apiError?: string | null
  onSubmit: (data: CreateReadingDTO | UpdateReadingDTO) => Promise<void>
  onCancel: () => void
}

export const ReadingForm: React.FC<ReadingFormProps> = ({
  initialReading,
  isLoading = false,
  apiError,
  onSubmit,
  onCancel,
}) => {
  const isEditing = Boolean(initialReading)

  const [formData, setFormData] = useState<ReadingFormData>(() => ({
    date: initialReading?.date || getTodayIsoString(),
    slot: initialReading?.slot || '',
    glucoseValue: initialReading ? String(initialReading.glucoseValue) : '',
  }))

  const [errors, setErrors] = useState<ReadingFormErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const handleFieldChange = <K extends keyof ReadingFormData>(
    field: K,
    value: ReadingFormData[K]
  ) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)

    if (hasAttemptedSubmit) {
      const fieldErrors = validateReadingForm(updated)
      setErrors(fieldErrors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)

    const validationErrors = validateReadingForm(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const payload: CreateReadingDTO = {
      date: formData.date.trim(),
      slot: formData.slot as ReadingSlotType,
      glucoseValue: parseInt(formData.glucoseValue.trim(), 10),
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError && (
        <Alert variant="danger" title={isEditing ? 'Update Failed' : 'Creation Failed'}>
          {apiError}
        </Alert>
      )}

      <GlucoseValueField
        value={formData.glucoseValue}
        error={errors.glucoseValue}
        disabled={isLoading}
        onChange={(val) => handleFieldChange('glucoseValue', val)}
      />

      <ReadingDateField
        value={formData.date}
        error={errors.date}
        disabled={isLoading}
        onChange={(val) => handleFieldChange('date', val)}
      />

      <ReadingSlotField
        value={formData.slot}
        error={errors.slot}
        disabled={isLoading}
        onChange={(val) => handleFieldChange('slot', val)}
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="outline" size="md" disabled={isLoading} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          {isEditing ? 'Save Changes' : 'Record Reading'}
        </Button>
      </div>
    </form>
  )
}
