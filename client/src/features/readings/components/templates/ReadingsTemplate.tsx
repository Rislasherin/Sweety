import React from 'react'
import { Alert } from '@/components/molecules/Alert'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../../types'
import { ReadingEmptyState } from '../molecules/ReadingEmptyState'
import { ReadingDeleteDialog } from '../molecules/ReadingDeleteDialog'
import { ReadingList } from '../organisms/ReadingList'
import { ReadingManagementHeader } from '../organisms/ReadingManagementHeader'
import { ReadingModal } from '../organisms/ReadingModal'

export interface ReadingsTemplateProps {
  readings: Reading[]
  isLoading: boolean
  isMutating: boolean
  fetchError: string | null
  mutationError: string | null
  feedbackMessage: { type: 'success' | 'info'; message: string } | null
  dateFilter: string
  // Modal states
  isFormModalOpen: boolean
  selectedReading: Reading | null
  isDeleteDialogOpen: boolean
  readingToDelete: Reading | null
  // Handlers
  onDateFilterChange: (date: string) => void
  onAddClick: () => void
  onEditClick: (reading: Reading) => void
  onDeleteClick: (reading: Reading) => void
  onFormSubmit: (data: CreateReadingDTO | UpdateReadingDTO) => Promise<void>
  onFormModalClose: () => void
  onConfirmDelete: () => Promise<void>
  onCancelDelete: () => void
  onDismissFeedback: () => void
  onRetryFetch: () => void
}

export const ReadingsTemplate: React.FC<ReadingsTemplateProps> = ({
  readings,
  isLoading,
  isMutating,
  fetchError,
  mutationError,
  feedbackMessage,
  dateFilter,
  isFormModalOpen,
  selectedReading,
  isDeleteDialogOpen,
  readingToDelete,
  onDateFilterChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onFormSubmit,
  onFormModalClose,
  onConfirmDelete,
  onCancelDelete,
  onDismissFeedback,
  onRetryFetch,
}) => {
  return (
    <div className="space-y-6">
      {/* Management Header */}
      <ReadingManagementHeader
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        onAddReading={onAddClick}
        disabled={isLoading || isMutating}
      />

      {/* Success / Info Feedback Banner */}
      {feedbackMessage && (
        <Alert variant={feedbackMessage.type} onClose={onDismissFeedback} className="shadow-2xs">
          {feedbackMessage.message}
        </Alert>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" className="text-teal-600 mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading glucose readings...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving your secure health records</p>
        </div>
      ) : fetchError ? (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Unable to Load Readings</h3>
          <p className="text-sm text-slate-500 mb-5">{fetchError}</p>
          <Button variant="primary" size="sm" onClick={onRetryFetch}>
            Retry Loading
          </Button>
        </div>
      ) : readings.length === 0 ? (
        <ReadingEmptyState
          hasDateFilter={Boolean(dateFilter)}
          onAddReading={onAddClick}
          onClearFilter={() => onDateFilterChange('')}
        />
      ) : (
        <ReadingList
          readings={readings}
          disabled={isMutating}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
        />
      )}

      {/* Add / Edit Reading Modal */}
      <ReadingModal
        isOpen={isFormModalOpen}
        initialReading={selectedReading}
        isLoading={isMutating}
        apiError={mutationError}
        onSubmit={onFormSubmit}
        onClose={onFormModalClose}
      />

      {/* Delete Confirmation Dialog */}
      <ReadingDeleteDialog
        isOpen={isDeleteDialogOpen}
        reading={readingToDelete}
        isLoading={isMutating}
        error={mutationError}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  )
}
