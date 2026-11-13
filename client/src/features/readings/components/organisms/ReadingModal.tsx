import React, { useEffect } from 'react'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../../types'
import { ReadingForm } from './ReadingForm'

export interface ReadingModalProps {
  isOpen: boolean
  initialReading?: Reading | null
  isLoading?: boolean
  apiError?: string | null
  onSubmit: (data: CreateReadingDTO | UpdateReadingDTO) => Promise<void>
  onClose: () => void
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  initialReading,
  isLoading = false,
  apiError,
  onSubmit,
  onClose,
}) => {
  const isEditing = Boolean(initialReading)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 id="reading-modal-title" className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Glucose Reading' : 'Add Glucose Reading'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Update your recorded blood glucose reading details.'
                : 'Log a new blood glucose level and its associated meal slot.'}
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <ReadingForm
            key={initialReading?.id ?? 'create-reading'}
            initialReading={initialReading}
            isLoading={isLoading}
            apiError={apiError}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
