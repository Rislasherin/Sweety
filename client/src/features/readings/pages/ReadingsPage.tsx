import React, { useState } from 'react'
import { useReadings } from '../hooks/useReadings'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../types'
import { ReadingsTemplate } from '../components/templates/ReadingsTemplate'

export const ReadingsPage: React.FC = () => {
  const {
    readings,
    isLoading,
    isMutating,
    error: fetchError,
    dateFilter,
    setDateFilter,
    fetchReadings,
    createReading,
    updateReading,
    deleteReading,
  } = useReadings()

  // Form modal state (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [readingToDelete, setReadingToDelete] = useState<Reading | null>(null)

  // Mutation error and feedback toast
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info'
    message: string
  } | null>(null)

  const showFeedback = (type: 'success' | 'info', message: string) => {
    setFeedbackMessage({ type, message })
    setTimeout(() => {
      setFeedbackMessage((current) => (current?.message === message ? null : current))
    }, 5000)
  }

  // Add click
  const handleAddClick = () => {
    setSelectedReading(null)
    setMutationError(null)
    setIsFormModalOpen(true)
  }

  // Edit click
  const handleEditClick = (reading: Reading) => {
    setSelectedReading(reading)
    setMutationError(null)
    setIsFormModalOpen(true)
  }

  // Delete click
  const handleDeleteClick = (reading: Reading) => {
    setReadingToDelete(reading)
    setMutationError(null)
    setIsDeleteDialogOpen(true)
  }

  // Form submit (create or update)
  const handleFormSubmit = async (data: CreateReadingDTO | UpdateReadingDTO) => {
    setMutationError(null)
    try {
      if (selectedReading) {
        await updateReading(selectedReading.id, data)
        setIsFormModalOpen(false)
        setSelectedReading(null)
        showFeedback('success', 'Glucose reading successfully updated.')
      } else {
        await createReading(data as CreateReadingDTO)
        setIsFormModalOpen(false)
        showFeedback('success', 'New glucose reading recorded successfully.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed. Please try again.'
      setMutationError(message)
    }
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!readingToDelete) return
    setMutationError(null)
    try {
      await deleteReading(readingToDelete.id)
      setIsDeleteDialogOpen(false)
      setReadingToDelete(null)
      showFeedback('info', 'Glucose reading was deleted.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed. Please try again.'
      setMutationError(message)
    }
  }

  return (
    <ReadingsTemplate
      readings={readings}
      isLoading={isLoading}
      isMutating={isMutating}
      fetchError={fetchError}
      mutationError={mutationError}
      feedbackMessage={feedbackMessage}
      dateFilter={dateFilter}
      isFormModalOpen={isFormModalOpen}
      selectedReading={selectedReading}
      isDeleteDialogOpen={isDeleteDialogOpen}
      readingToDelete={readingToDelete}
      onDateFilterChange={setDateFilter}
      onAddClick={handleAddClick}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteClick}
      onFormSubmit={handleFormSubmit}
      onFormModalClose={() => {
        setIsFormModalOpen(false)
        setSelectedReading(null)
        setMutationError(null)
      }}
      onConfirmDelete={handleConfirmDelete}
      onCancelDelete={() => {
        setIsDeleteDialogOpen(false)
        setReadingToDelete(null)
        setMutationError(null)
      }}
      onDismissFeedback={() => setFeedbackMessage(null)}
      onRetryFetch={() => void fetchReadings(dateFilter)}
    />
  )
}
