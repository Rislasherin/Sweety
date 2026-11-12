import React from 'react'
import type { DailyReport } from '../../types'
import { formatReportPeriodRange } from '../../utils/reportUtils'
import { ReportSummarySection } from './ReportSummarySection'
import { DailySlotChart } from '../molecules/DailySlotChart'
import { DailyReadingsTable } from '../molecules/DailyReadingsTable'
import { ReportEmptyState } from '../molecules/ReportEmptyState'

export interface DailyReportViewProps {
  report: DailyReport
  date: string
  onLogReading?: () => void
  className?: string
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  report,
  date,
  onLogReading,
  className,
}) => {
  const formattedRange = formatReportPeriodRange(report.startDate, report.endDate, 'DAILY')
  const hasData = report.hasData && report.readings.length > 0

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 4-Stat Metric Summary */}
      <ReportSummarySection
        highest={report.highest}
        lowest={report.lowest}
        average={report.average}
        count={report.count}
      />

      {hasData ? (
        <>
          {/* Slot Curve Visualization */}
          <DailySlotChart readings={report.readings} date={formattedRange || date} />

          {/* Canonical Slots Breakdown Table */}
          <DailyReadingsTable readings={report.readings} date={formattedRange || date} />
        </>
      ) : (
        <ReportEmptyState
          period="daily"
          dateRange={formattedRange || date}
          onLogReading={onLogReading}
        />
      )}
    </div>
  )
}
