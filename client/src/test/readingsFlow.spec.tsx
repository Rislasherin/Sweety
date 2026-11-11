import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlucoseValue } from '../features/readings/components/atoms/GlucoseValue'
import { ReadingSlotBadge } from '../features/readings/components/atoms/ReadingSlotBadge'
import { ReadingDeleteDialog } from '../features/readings/components/molecules/ReadingDeleteDialog'
import { ReadingEmptyState } from '../features/readings/components/molecules/ReadingEmptyState'
import { ReadingForm } from '../features/readings/components/organisms/ReadingForm'
import { ReadingList } from '../features/readings/components/organisms/ReadingList'
import { ReadingsPage } from '../features/readings/pages/ReadingsPage'
import { readingService } from '../features/readings/services/readingService'
import type { Reading } from '../features/readings/types'
import { getTodayIsoString } from '../utils/date'

describe('Glucose Readings UI Flow & Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const today = getTodayIsoString()

  const sampleReading: Reading = {
    id: 'reading-1',
    userId: 'user-1',
    date: today,
    slot: 'MORNING',
    glucoseValue: 95,
    createdAt: `${today}T08:00:00.000Z`,
    updatedAt: `${today}T08:00:00.000Z`,
  }

  describe('GlucoseValue Atom', () => {
    it('renders glucose value, unit, and clinical category badge', () => {
      render(<GlucoseValue value={95} />)
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByText('mg/dL')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument()
    })

    it('renders High category badge for values >= 126', () => {
      render(<GlucoseValue value={160} />)
      expect(screen.getByText('160')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('renders Low category badge for values < 70', () => {
      render(<GlucoseValue value={55} />)
      expect(screen.getByText('55')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
    })
  })

  describe('ReadingSlotBadge Atom', () => {
    it('renders user-friendly label for each slot', () => {
      const { rerender } = render(<ReadingSlotBadge slot="MORNING" />)
      expect(screen.getByText('Morning')).toBeInTheDocument()

      rerender(<ReadingSlotBadge slot="AFTER_BREAKFAST" />)
      expect(screen.getByText('After Breakfast')).toBeInTheDocument()

      rerender(<ReadingSlotBadge slot="AFTER_LUNCH" />)
      expect(screen.getByText('After Lunch')).toBeInTheDocument()

      rerender(<ReadingSlotBadge slot="AFTER_DINNER" />)
      expect(screen.getByText('After Dinner')).toBeInTheDocument()
    })
  })

  describe('ReadingForm Organism', () => {
    it('displays validation errors when submitting empty form', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()

      render(<ReadingForm onSubmit={handleSubmit} onCancel={vi.fn()} />)

      // Submit immediately
      await user.click(screen.getByRole('button', { name: /record reading/i }))

      expect(screen.getByText(/glucose value is required/i)).toBeInTheDocument()
      expect(screen.getByText(/reading slot is required/i)).toBeInTheDocument()
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('rejects decimal glucose values', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()

      render(<ReadingForm onSubmit={handleSubmit} onCancel={vi.fn()} />)

      const valueInput = screen.getByLabelText(/blood glucose value/i)
      await user.type(valueInput, '95.5')

      await user.click(screen.getByRole('button', { name: /record reading/i }))

      expect(screen.getByText(/must be a whole number/i)).toBeInTheDocument()
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('rejects values below 40 or above 600', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()

      const { rerender } = render(<ReadingForm onSubmit={handleSubmit} onCancel={vi.fn()} />)

      const valueInput = screen.getByLabelText(/blood glucose value/i)
      await user.type(valueInput, '35')

      await user.click(screen.getByRole('button', { name: /record reading/i }))
      expect(screen.getByText(/at least 40 mg\/dL/i)).toBeInTheDocument()

      await user.clear(valueInput)
      await user.type(valueInput, '650')

      rerender(<ReadingForm onSubmit={handleSubmit} onCancel={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /record reading/i }))
      expect(screen.getByText(/at most 600 mg\/dL/i)).toBeInTheDocument()
    })

    it('submits valid reading data when filled correctly', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(<ReadingForm onSubmit={handleSubmit} onCancel={vi.fn()} />)

      const valueInput = screen.getByLabelText(/blood glucose value/i)
      await user.type(valueInput, '115')

      const slotSelect = screen.getByLabelText(/reading slot/i)
      await user.selectOptions(slotSelect, 'AFTER_LUNCH')

      await user.click(screen.getByRole('button', { name: /record reading/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          date: today,
          slot: 'AFTER_LUNCH',
          glucoseValue: 115,
        })
      })
    })

    it('prepopulates fields in edit mode and allows updating', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <ReadingForm initialReading={sampleReading} onSubmit={handleSubmit} onCancel={vi.fn()} />
      )

      const valueInput = screen.getByLabelText(/blood glucose value/i) as HTMLInputElement
      expect(valueInput.value).toBe('95')

      const slotSelect = screen.getByLabelText(/reading slot/i) as HTMLSelectElement
      expect(slotSelect.value).toBe('MORNING')

      await user.clear(valueInput)
      await user.type(valueInput, '105')

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          date: today,
          slot: 'MORNING',
          glucoseValue: 105,
        })
      })
    })

    it('displays API error alert when apiError prop is passed', () => {
      render(
        <ReadingForm
          apiError="A reading for this slot already exists on this date."
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(
        screen.getByText(/a reading for this slot already exists on this date/i)
      ).toBeInTheDocument()
    })
  })

  describe('ReadingList Organism', () => {
    it('renders date section headers and items with slot badges', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(<ReadingList readings={[sampleReading]} onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.getByText('1 of 4 slots logged')).toBeInTheDocument()
      expect(screen.getByText('Morning')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByTitle(/edit reading/i)).toBeInTheDocument()
      expect(screen.getByTitle(/delete reading/i)).toBeInTheDocument()
    })

    it('triggers onEdit and onDelete when clicking action buttons', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(<ReadingList readings={[sampleReading]} onEdit={onEdit} onDelete={onDelete} />)

      await user.click(screen.getByTitle(/edit reading/i))
      expect(onEdit).toHaveBeenCalledWith(sampleReading)

      await user.click(screen.getByTitle(/delete reading/i))
      expect(onDelete).toHaveBeenCalledWith(sampleReading)
    })
  })

  describe('ReadingDeleteDialog Molecule', () => {
    it('renders reading details and confirms deletion', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(
        <ReadingDeleteDialog
          isOpen={true}
          reading={sampleReading}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )

      expect(screen.getByText(/delete glucose reading/i)).toBeInTheDocument()
      expect(screen.getByText('Morning')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /^delete reading$/i }))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('calls onCancel when clicking cancel button', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(
        <ReadingDeleteDialog
          isOpen={true}
          reading={sampleReading}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('ReadingEmptyState Molecule', () => {
    it('renders general empty state with Add Reading CTA', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<ReadingEmptyState hasDateFilter={false} onAddReading={onAdd} />)

      expect(screen.getByText(/no glucose readings yet/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /\+ add your first reading/i }))
      expect(onAdd).toHaveBeenCalled()
    })

    it('renders filtered empty state with clear filter option', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onClear = vi.fn()

      render(
        <ReadingEmptyState hasDateFilter={true} onAddReading={onAdd} onClearFilter={onClear} />
      )

      expect(screen.getByText(/no readings for this date/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /show all dates/i }))
      expect(onClear).toHaveBeenCalled()
    })
  })

  describe('ReadingsPage Integration', () => {
    it('loads and displays readings from readingService', async () => {
      vi.spyOn(readingService, 'getReadings').mockResolvedValueOnce([sampleReading])

      render(<ReadingsPage />)

      expect(screen.getByText(/loading glucose readings/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Glucose Readings')).toBeInTheDocument()
        expect(screen.getByText('Morning')).toBeInTheDocument()
        expect(screen.getByText('95')).toBeInTheDocument()
      })
    })

    it('displays error message and allows retry when loading fails', async () => {
      vi.spyOn(readingService, 'getReadings')
        .mockRejectedValueOnce(new Error('Network connection failed'))
        .mockResolvedValueOnce([sampleReading])

      render(<ReadingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/unable to load readings/i)).toBeInTheDocument()
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
      })

      const retryBtn = screen.getByRole('button', { name: /retry loading/i })
      await userEvent.click(retryBtn)

      await waitFor(() => {
        expect(screen.getByText('Morning')).toBeInTheDocument()
      })
    })

    it('displays friendly duplicate slot error when creating reading fails with 409', async () => {
      const user = userEvent.setup()
      vi.spyOn(readingService, 'getReadings').mockResolvedValueOnce([])
      vi.spyOn(readingService, 'createReading').mockRejectedValueOnce({
        statusCode: 409,
        message: 'A reading for this slot already exists on this date',
      })

      render(<ReadingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/no glucose readings yet/i)).toBeInTheDocument()
      })

      // Open Add Reading modal
      await user.click(screen.getByRole('button', { name: /\+ add your first reading/i }))

      const valueInput = screen.getByLabelText(/blood glucose value/i)
      await user.type(valueInput, '110')

      const slotSelect = screen.getByLabelText(/reading slot/i)
      await user.selectOptions(slotSelect, 'MORNING')

      await user.click(screen.getByRole('button', { name: /record reading/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/a reading for this slot already exists on this date/i)
        ).toBeInTheDocument()
      })
    })
  })
})
