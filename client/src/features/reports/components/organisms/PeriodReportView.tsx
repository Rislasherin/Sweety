import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import type { MonthToDateReport, PreviousMonthReport, ReportPeriod } from '../../types'
import {
  formatReportPeriodRange,
  getReportClinicalCategory,
  getReportCategoryVariant,
  getReportCategoryLabel,
} from '../../utils/reportUtils'
import { ReportSummarySection } from './ReportSummarySection'
import { GlycemicSpreadGauge } from '../molecules/GlycemicSpreadGauge'
import { ReportEmptyState } from '../molecules/ReportEmptyState'

export interface PeriodReportViewProps {
  report: MonthToDateReport | PreviousMonthReport
  period: Extract<ReportPeriod, 'month-to-date' | 'previous-month'>
  onLogReading?: () => void
  className?: string
}

export const PeriodReportView: React.FC<PeriodReportViewProps> = ({
  report,
  period,
  onLogReading,
  className,
}) => {
  const periodTitle = period === 'month-to-date' ? 'Month-to-Date' : 'Previous Month'
  const dateRange = formatReportPeriodRange(report.startDate, report.endDate, report.reportType)
  const hasData = report.hasData && report.count > 0

  const avgCategory = getReportClinicalCategory(report.average)
  const avgVariant = getReportCategoryVariant(avgCategory)
  const avgLabel = getReportCategoryLabel(avgCategory)

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
          {/* Glycemic Distribution Gauge */}
          <GlycemicSpreadGauge
            highest={report.highest}
            lowest={report.lowest}
            average={report.average}
            count={report.count}
            periodTitle={periodTitle}
            dateRange={dateRange}
          />

          {/* Period Context & Clinical Observations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">
                  {periodTitle} Clinical Overview
                </CardTitle>
                <Badge variant={avgVariant} size="sm">
                  {avgLabel}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Summary context for {dateRange}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Period Window</span>
                  <p className="text-slate-600">
                    Covering <span className="font-medium text-slate-900">{report.startDate}</span> through{' '}
                    <span className="font-medium text-slate-900">{report.endDate}</span>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Target Reference</span>
                  <p className="text-slate-600">
                    Typical targets are <span className="font-medium text-slate-900">70–99 mg/dL</span> for fasting and{' '}
                    <span className="font-medium text-slate-900">&lt; 140 mg/dL</span> post-meal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Clinical Note</span>
                  <p className="text-slate-600">
                    These summary statistics help evaluate overall metabolic stability. Always discuss trends with your physician.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <ReportEmptyState period={period} dateRange={dateRange} onLogReading={onLogReading} />
      )}
    </div>
  )
}
