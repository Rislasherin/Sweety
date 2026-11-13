import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReports } from '../hooks/useReports'
import { ReportsTemplate } from '../components/templates/ReportsTemplate'

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    activePeriod,
    selectedDate,
    report,
    dailyReport,
    isLoading,
    error,
    setActivePeriod,
    setSelectedDate,
    refetch,
    clearError,
  } = useReports()

  useEffect(() => {
    document.title = 'Sweety — Reports & Analytics'
  }, [])

  return (
    <ReportsTemplate
      activePeriod={activePeriod}
      selectedDate={selectedDate}
      report={report}
      dailyReport={dailyReport}
      isLoading={isLoading}
      error={error}
      onPeriodChange={setActivePeriod}
      onDateChange={setSelectedDate}
      onRetry={() => void refetch()}
      onClearError={clearError}
      onLogReading={() => navigate('/readings')}
    />
  )
}
