import React, { useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { Alert } from '@/components/molecules/Alert'
import type { Reading } from '../../types'
import { formatDateOnly, formatReadingSlot } from '../../utils/readingValidation'
import { GlucoseValue } from '../atoms/GlucoseValue'

export interface ReadingDeleteDialogProps {
  isOpen: boolean
  reading: Reading | null
  isLoading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const ReadingDeleteDialog: React.FC<ReadingDeleteDialogProps> = ({
  isOpen,
  reading,
  isLoading = false,
  error,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen || !reading) return null

  const formattedDate = formatDateOnly(reading.date)
  const formattedSlot = formatReadingSlot(reading.slot)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                Delete Glucose Reading
              </h3>
              <p className="text-xs text-slate-500">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Meal Slot:</span>
              <span className="font-semibold text-slate-800">{formattedSlot}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Glucose Value:</span>
              <GlucoseValue value={reading.glucoseValue} size="sm" />
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete this reading from your history?
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="md" disabled={isLoading} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            Delete Reading
          </Button>
        </div>
      </div>
    </div>
  )
}
