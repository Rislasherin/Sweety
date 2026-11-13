import React from 'react'
import { MetricStatCard } from '../atoms/MetricStatCard'
import {
  formatStatValue,
  getReportClinicalCategory,
  getReportCategoryVariant,
  getReportCategoryLabel,
} from '../../utils/reportUtils'

export interface ReportSummarySectionProps {
  highest: number | null
  lowest: number | null
  average: number | null
  count: number
  className?: string
}

export const ReportSummarySection: React.FC<ReportSummarySectionProps> = ({
  highest,
  lowest,
  average,
  count,
  className,
}) => {
  const avgCategory = getReportClinicalCategory(average)
  const avgVariant = getReportCategoryVariant(avgCategory)
  const avgLabel = average !== null ? getReportCategoryLabel(avgCategory) : undefined

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      {/* Average Glucose */}
      <MetricStatCard
        label="Average Glucose"
        value={formatStatValue(average)}
        badgeText={avgLabel}
        badgeVariant={avgVariant}
        subtext="Overall average for this period"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      />

      {/* Highest Reading */}
      <MetricStatCard
        label="Highest Reading"
        value={formatStatValue(highest)}
        subtext="Highest reading recorded"
        badgeText={highest !== null && highest >= 126 ? 'High' : undefined}
        badgeVariant={highest !== null && highest >= 126 ? 'danger' : 'neutral'}
        icon={
          <svg
            className="w-4 h-4 text-rose-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        }
      />

      {/* Lowest Reading */}
      <MetricStatCard
        label="Lowest Reading"
        value={formatStatValue(lowest)}
        subtext="Lowest reading recorded"
        badgeText={lowest !== null && lowest < 70 ? 'Low' : undefined}
        badgeVariant={lowest !== null && lowest < 70 ? 'warning' : 'neutral'}
        icon={
          <svg
            className="w-4 h-4 text-sky-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        }
      />

      {/* Readings Logged */}
      <MetricStatCard
        label="Readings Logged"
        value={count.toString()}
        subtext="Recorded entries across this period"
        icon={
          <svg
            className="w-4 h-4 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />
    </div>
  )
}
