import React from 'react'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Alert } from '@/components/molecules/Alert'
import type { AnyReport, DailyReport, ReportPeriod } from '../../types'
import { ReportPeriodNav } from '../molecules/ReportPeriodNav'
import { DailyReportView } from '../organisms/DailyReportView'
import { PeriodReportView } from '../organisms/PeriodReportView'

export interface ReportsTemplateProps {
  activePeriod: ReportPeriod
  selectedDate: string
  report: AnyReport | null
  dailyReport: DailyReport | null
  isLoading: boolean
  error: string | null
  onPeriodChange: (period: ReportPeriod) => void
  onDateChange: (date: string) => void
  onRetry: () => void
  onClearError?: () => void
  onLogReading?: () => void
}

export const ReportsTemplate: React.FC<ReportsTemplateProps> = ({
  activePeriod,
  selectedDate,
  report,
  dailyReport,
  isLoading,
  error,
  onPeriodChange,
  onDateChange,
  onRetry,
  onClearError,
  onLogReading,
}) => {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your glycemic patterns, trends, and clinical averages
          </p>
        </div>

        {onLogReading && (
          <Button
            variant="primary"
            size="sm"
            onClick={onLogReading}
            className="self-start sm:self-auto"
          >
            + Log Reading
          </Button>
        )}
      </div>

      {/* Period navigation tabs and anchor date picker */}
      <ReportPeriodNav
        activePeriod={activePeriod}
        selectedDate={selectedDate}
        onPeriodChange={onPeriodChange}
        onDateChange={onDateChange}
        disabled={isLoading}
      />

      {/* Error state */}
      {error && (
        <Alert variant="danger" title="Report Loading Error" onClose={onClearError}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="self-start sm:self-auto shrink-0"
            >
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-slate-100 shadow-2xs">
            <Spinner size="lg" className="text-teal-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading Report Data...</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Fetching glycemic statistics for the selected period
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="card" height="110px" />
            <Skeleton variant="card" height="110px" />
            <Skeleton variant="card" height="110px" />
            <Skeleton variant="card" height="110px" />
          </div>
          <Skeleton variant="card" height="240px" />
        </div>
      )}

      {/* Loaded report views */}
      {!isLoading && !error && report && (
        <>
          {activePeriod === 'daily' && dailyReport && (
            <DailyReportView report={dailyReport} date={selectedDate} onLogReading={onLogReading} />
          )}

          {activePeriod !== 'daily' && (
            <PeriodReportView report={report} period={activePeriod} onLogReading={onLogReading} />
          )}
        </>
      )}
    </div>
  )
}
