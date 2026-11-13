import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MetricStatCard } from '../features/reports/components/atoms/MetricStatCard'
import { PeriodTabButton } from '../features/reports/components/atoms/PeriodTabButton'
import { ReportPeriodNav } from '../features/reports/components/molecules/ReportPeriodNav'
import { DailySlotChart } from '../features/reports/components/molecules/DailySlotChart'
import { MonthlyTrendChart } from '../features/reports/components/molecules/MonthlyTrendChart'
import { GlycemicSpreadGauge } from '../features/reports/components/molecules/GlycemicSpreadGauge'
import { DailyReadingsTable } from '../features/reports/components/molecules/DailyReadingsTable'
import { ReportEmptyState } from '../features/reports/components/molecules/ReportEmptyState'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { reportService } from '../features/reports/services/reportService'
import type { DailyReport, MonthToDateReport, PreviousMonthReport } from '../features/reports/types'

describe('Reports & Analytics UI Flow & Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockDailyReport: DailyReport = {
    reportType: 'DAILY',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    highest: 155,
    lowest: 82,
    average: 112.5,
    count: 3,
    totalReadings: 3,
    hasData: true,
    readings: [
      {
        id: 'r-1',
        date: '2026-11-12',
        slot: 'MORNING',
        glucoseValue: 82,
        createdAt: '2026-11-12T07:30:00.000Z',
      },
      {
        id: 'r-2',
        date: '2026-11-12',
        slot: 'AFTER_BREAKFAST',
        glucoseValue: 155,
        createdAt: '2026-11-12T09:30:00.000Z',
      },
      {
        id: 'r-3',
        date: '2026-11-12',
        slot: 'AFTER_LUNCH',
        glucoseValue: 100,
        createdAt: '2026-11-12T13:30:00.000Z',
      },
    ],
  }

  const mockEmptyDailyReport: DailyReport = {
    reportType: 'DAILY',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    highest: null,
    lowest: null,
    average: null,
    count: 0,
    totalReadings: 0,
    hasData: false,
    readings: [],
  }

  const mockMtdReport: MonthToDateReport = {
    reportType: 'MONTH_TO_DATE',
    startDate: '2026-11-01',
    endDate: '2026-11-12',
    highest: 172,
    lowest: 74,
    average: 115.8,
    count: 25,
    totalReadings: 25,
    hasData: true,
    dailyTrends: [
      { date: '2026-11-01', average: 105.0, count: 2, highest: 120, lowest: 90 },
      { date: '2026-11-05', average: 118.5, count: 3, highest: 140, lowest: 95 },
      { date: '2026-11-10', average: 124.0, count: 4, highest: 172, lowest: 88 },
      { date: '2026-11-12', average: 112.0, count: 2, highest: 130, lowest: 74 },
    ],
  }

  const mockPrevMonthReport: PreviousMonthReport = {
    reportType: 'PREVIOUS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    highest: 168,
    lowest: 70,
    average: 108.3,
    count: 65,
    totalReadings: 65,
    hasData: true,
  }

  describe('MetricStatCard Atom', () => {
    it('renders label, value, subtext, and badge correctly', () => {
      render(
        <MetricStatCard
          label="Average Glucose"
          value="112.5 mg/dL"
          subtext="Clinical benchmark"
          badgeText="Normal (70–99)"
          badgeVariant="success"
        />
      )

      expect(screen.getByText('Average Glucose')).toBeInTheDocument()
      expect(screen.getByText('112.5 mg/dL')).toBeInTheDocument()
      expect(screen.getByText('Clinical benchmark')).toBeInTheDocument()
      expect(screen.getByText('Normal (70–99)')).toBeInTheDocument()
    })

    it('renders empty placeholder "—" gracefully without crashing', () => {
      render(<MetricStatCard label="Highest Reading" value="—" subtext="No readings recorded" />)

      expect(screen.getByText('Highest Reading')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('PeriodTabButton Atom', () => {
    it('applies active styles when isActive is true and triggers onClick', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      const { rerender } = render(
        <PeriodTabButton label="Daily Report" isActive={true} onClick={onClick} />
      )

      const button = screen.getByRole('tab', { name: /Daily Report/i })
      expect(button).toHaveAttribute('aria-selected', 'true')

      await user.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)

      rerender(<PeriodTabButton label="Daily Report" isActive={false} onClick={onClick} />)
      expect(button).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('ReportPeriodNav Molecule', () => {
    it('renders period tabs and date input, invoking callbacks on change', async () => {
      const user = userEvent.setup()
      const onPeriodChange = vi.fn()
      const onDateChange = vi.fn()

      render(
        <ReportPeriodNav
          activePeriod="daily"
          selectedDate="2026-11-12"
          onPeriodChange={onPeriodChange}
          onDateChange={onDateChange}
        />
      )

      expect(screen.getByRole('tab', { name: /Daily Report/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Month-to-Date/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Previous Month/i })).toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: /Month-to-Date/i }))
      expect(onPeriodChange).toHaveBeenCalledWith('month-to-date')

      const dateInput = screen.getByLabelText(/Report Date:/i)
      expect(dateInput).toHaveValue('2026-11-12')
    })
  })

  describe('DailySlotChart Molecule', () => {
    it('renders accessible SVG chart with meal slot labels and reference lines', () => {
      render(<DailySlotChart readings={mockDailyReport.readings} date="2026-11-12" />)

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: /Daily Meal Slot Glucose Curve/i })
      ).toBeInTheDocument()
      expect(screen.getByText('3 / 4 Slots Recorded')).toBeInTheDocument()
      expect(screen.getAllByText('Morning')).toHaveLength(2) // Once in chart label, once in sr-only table
      expect(screen.getAllByText('After Breakfast')).toHaveLength(2)
      expect(screen.getAllByText('After Lunch')).toHaveLength(2)
      expect(screen.getAllByText('After Dinner')).toHaveLength(2)
    })
  })

  describe('MonthlyTrendChart Molecule', () => {
    const mockDailyTrends = [
      { date: '2026-11-01', average: 95.0, count: 2, highest: 110, lowest: 80 },
      { date: '2026-11-05', average: 118.5, count: 3, highest: 140, lowest: 95 },
      { date: '2026-11-10', average: 130.0, count: 4, highest: 172, lowest: 88 },
    ]

    it('renders accessible SVG chart with title, points, legends, and sr-only table', () => {
      render(
        <MonthlyTrendChart
          dailyTrends={mockDailyTrends}
          periodTitle="Month-to-Date"
          dateRange="Nov 1, 2026 – Nov 10, 2026"
        />
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.getByText('Month-to-Date Daily Glucose Trend')).toBeInTheDocument()
      expect(screen.getByText('3 Active Days')).toBeInTheDocument()
      expect(screen.getAllByText(/Normal \(70–99\)/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Elevated \(100–125\)/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/High \(≥ 126\)/i).length).toBeGreaterThanOrEqual(1)
      expect(
        screen.getByText('Month-to-Date daily glucose averages for Nov 1, 2026 – Nov 10, 2026')
      ).toBeInTheDocument()
    })

    it('renders single trend point without crashing and shows 1 Active Day', () => {
      render(
        <MonthlyTrendChart
          dailyTrends={[{ date: '2026-11-01', average: 100.0, count: 1, highest: 100, lowest: 100 }]}
          periodTitle="Previous Month"
          dateRange="Oct 1, 2026 – Oct 31, 2026"
        />
      )

      expect(screen.getByText('1 Active Day')).toBeInTheDocument()
    })

    it('renders empty notice when dailyTrends is empty', () => {
      render(
        <MonthlyTrendChart
          dailyTrends={[]}
          periodTitle="Month-to-Date"
          dateRange="Nov 1, 2026 – Nov 12, 2026"
        />
      )

      expect(
        screen.getByText(/No daily trend data available for this reporting period/i)
      ).toBeInTheDocument()
    })
  })

  describe('GlycemicSpreadGauge Molecule', () => {
    it('renders distribution gauge with min, max, average, and count', () => {
      render(
        <GlycemicSpreadGauge
          highest={172}
          lowest={74}
          average={115.8}
          count={25}
          periodTitle="Month-to-Date"
          dateRange="Nov 1, 2026 – Nov 12, 2026"
        />
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.getByText('Month-to-Date Glycemic Spread & Distribution')).toBeInTheDocument()
      expect(screen.getByText('Min 74')).toBeInTheDocument()
      expect(screen.getByText('Avg 115.8')).toBeInTheDocument()
      expect(screen.getByText('Max 172')).toBeInTheDocument()
    })

    it('renders empty notice when count is 0', () => {
      render(
        <GlycemicSpreadGauge
          highest={null}
          lowest={null}
          average={null}
          count={0}
          periodTitle="Month-to-Date"
          dateRange="Nov 1, 2026 – Nov 12, 2026"
        />
      )

      expect(
        screen.getByText(/No readings recorded for this aggregation period/i)
      ).toBeInTheDocument()
    })
  })

  describe('DailyReadingsTable Molecule', () => {
    it('displays logged meal slots and badges for unlogged meal slots', () => {
      render(<DailyReadingsTable readings={mockDailyReport.readings} date="2026-11-12" />)

      expect(screen.getByText('Daily Readings Breakdown')).toBeInTheDocument()
      expect(screen.getByText('3 of 4 Recorded')).toBeInTheDocument()
      expect(screen.getByText('82')).toBeInTheDocument()
      expect(screen.getByText('155')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Not logged for this day')).toBeInTheDocument()
    })
  })

  describe('ReportEmptyState Molecule', () => {
    it('renders supportive message and triggers action button', async () => {
      const user = userEvent.setup()
      const onLogReading = vi.fn()

      render(
        <ReportEmptyState period="daily" dateRange="Nov 12, 2026" onLogReading={onLogReading} />
      )

      expect(screen.getByText(/No Readings Found for this day/i)).toBeInTheDocument()
      const actionBtn = screen.getByRole('button', { name: /\+ Log a Reading/i })
      await user.click(actionBtn)
      expect(onLogReading).toHaveBeenCalledTimes(1)
    })
  })

  describe('ReportsPage Full Flow', () => {
    it('renders daily report data, slot chart, and breakdown by default', async () => {
      vi.spyOn(reportService, 'getDailyReport').mockResolvedValue(mockDailyReport)

      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      )

      // Shows loading initially
      expect(screen.getByText(/Loading Report Data.../i)).toBeInTheDocument()

      // Await data load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Report Data.../i)).not.toBeInTheDocument()
      })

      // Summary metrics
      expect(screen.getByText('112.5 mg/dL')).toBeInTheDocument()
      expect(screen.getByText('155 mg/dL')).toBeInTheDocument()
      expect(screen.getByText('82 mg/dL')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()

      // Chart and table
      expect(
        screen.getByRole('heading', { name: /Daily Meal Slot Glucose Curve/i })
      ).toBeInTheDocument()
      expect(screen.getByText('Daily Readings Breakdown')).toBeInTheDocument()
    })

    it('navigates between periods: Month-to-Date and Previous Month', async () => {
      const user = userEvent.setup()
      vi.spyOn(reportService, 'getDailyReport').mockResolvedValue(mockDailyReport)
      vi.spyOn(reportService, 'getMonthToDateReport').mockResolvedValue(mockMtdReport)
      vi.spyOn(reportService, 'getPreviousMonthReport').mockResolvedValue(mockPrevMonthReport)

      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText(/Loading Report Data.../i)).not.toBeInTheDocument()
      })

      // Switch to Month-to-Date
      await user.click(screen.getByRole('tab', { name: /Month-to-Date/i }))

      await waitFor(() => {
        expect(screen.getByText('Month-to-Date Glycemic Spread & Distribution')).toBeInTheDocument()
      })
      expect(screen.getByText('Month-to-Date Daily Glucose Trend')).toBeInTheDocument()
      expect(screen.getByText('4 Active Days')).toBeInTheDocument()
      expect(screen.getAllByText('115.8 mg/dL').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('172 mg/dL').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('74 mg/dL').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1)

      // Switch to Previous Month
      await user.click(screen.getByRole('tab', { name: /Previous Month/i }))

      await waitFor(() => {
        expect(
          screen.getByText('Previous Month Glycemic Spread & Distribution')
        ).toBeInTheDocument()
      })
      expect(screen.getAllByText('108.3 mg/dL').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('65').length).toBeGreaterThanOrEqual(1)
    })

    it('renders empty state without displaying "0 mg/dL" for null stats when no data exists', async () => {
      vi.spyOn(reportService, 'getDailyReport').mockResolvedValue(mockEmptyDailyReport)

      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText(/Loading Report Data.../i)).not.toBeInTheDocument()
      })

      // Confirm stats display '—' and NOT '0 mg/dL'
      const dashElements = screen.getAllByText('—')
      expect(dashElements.length).toBeGreaterThanOrEqual(3)
      expect(screen.queryByText('0 mg/dL')).not.toBeInTheDocument()

      // Empty state visible
      expect(screen.getByText(/No Readings Found for this day/i)).toBeInTheDocument()
    })

    it('handles API errors with retry option', async () => {
      const user = userEvent.setup()
      vi.spyOn(reportService, 'getDailyReport')
        .mockRejectedValueOnce(new Error('Backend temporary failure'))
        .mockResolvedValueOnce(mockDailyReport)

      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(screen.getByText(/Backend temporary failure/i)).toBeInTheDocument()

      // Click retry button
      const retryBtn = screen.getByRole('button', { name: /Retry/i })
      await user.click(retryBtn)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByText('112.5 mg/dL')).toBeInTheDocument()
      })
    })
  })
})
