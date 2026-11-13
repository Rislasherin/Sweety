import React from 'react'
import { Input } from '@/components/atoms/Input'
import { getTodayIsoString } from '@/utils/date'
import type { ReportPeriod } from '../../types'
import { PeriodTabButton } from '../atoms/PeriodTabButton'

export interface ReportPeriodNavProps {
  activePeriod: ReportPeriod
  selectedDate: string
  onPeriodChange: (period: ReportPeriod) => void
  onDateChange: (date: string) => void
  disabled?: boolean
}

export const ReportPeriodNav: React.FC<ReportPeriodNavProps> = ({
  activePeriod,
  selectedDate,
  onPeriodChange,
  onDateChange,
  disabled = false,
}) => {
  const today = getTodayIsoString()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-100/80 rounded-2xl border border-slate-200">
      {/* Period Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1" role="tablist">
        <PeriodTabButton
          label="Daily Report"
          isActive={activePeriod === 'daily'}
          onClick={() => onPeriodChange('daily')}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
            </svg>
          }
        />
        <PeriodTabButton
          label="Month-to-Date"
          isActive={activePeriod === 'month-to-date'}
          onClick={() => onPeriodChange('month-to-date')}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v1h14V5a1 1 0 00-1-1H4zm13 3H3v8a1 1 0 001 1h12a1 1 0 001-1V7z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <PeriodTabButton
          label="Previous Month"
          isActive={activePeriod === 'previous-month'}
          onClick={() => onPeriodChange('previous-month')}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Anchor Date Picker */}
      <div className="flex items-center gap-2.5 px-2">
        <label
          htmlFor="report-anchor-date"
          className="text-xs font-semibold text-slate-600 whitespace-nowrap"
        >
          {activePeriod === 'daily'
            ? 'Report Date:'
            : activePeriod === 'month-to-date'
              ? 'Anchor Date:'
              : 'Reference Date:'}
        </label>
        <Input
          id="report-anchor-date"
          type="date"
          max={today}
          value={selectedDate}
          disabled={disabled}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-auto py-1 text-xs font-medium"
        />
      </div>
    </div>
  )
}
