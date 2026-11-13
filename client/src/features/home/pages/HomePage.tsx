import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Spinner,
  Skeleton,
} from '@/components/atoms'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { readingService } from '@/features/readings/services/readingService'
import type { Reading } from '@/features/readings/types'
import { GlucoseValue } from '@/features/readings/components/atoms/GlucoseValue'
import { ReadingSlotBadge } from '@/features/readings/components/atoms/ReadingSlotBadge'
import { getTodayIsoString, formatTime } from '@/utils/date'
import { formatDateOnly } from '@/features/readings/utils/readingValidation'
import {
  getReportClinicalCategory,
  getReportCategoryVariant,
  getReportCategoryLabel,
} from '@/features/reports/utils/reportUtils'

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const today = useMemo(() => getTodayIsoString(), [])

  const [todayReadings, setTodayReadings] = useState<Reading[]>([])
  const [recentReadings, setRecentReadings] = useState<Reading[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryTrigger, setRetryTrigger] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true
    const loadOverviewData = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const [todayData, recentData] = await Promise.all([
          readingService.getReadings({ date: today }),
          readingService.getReadings({ page: 1, limit: 5 }),
        ])

        if (isMounted) {
          setTodayReadings(todayData.readings || todayData)
          setRecentReadings(recentData.readings || recentData)
        }
      } catch {
        if (isMounted) {
          setLoadError("We couldn't load your recent overview data. Please try again.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOverviewData()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, today, retryTrigger])

  useEffect(() => {
    document.title = 'Sweety — Dashboard'
  }, [])

  // Computed today's metrics
  const todayCount = todayReadings.length
  const todayAverage = useMemo(() => {
    if (todayCount === 0) return null
    const sum = todayReadings.reduce((acc, r) => acc + r.glucoseValue, 0)
    return Math.round((sum / todayCount) * 10) / 10
  }, [todayReadings, todayCount])

  const latestReading = useMemo(() => {
    if (todayReadings.length > 0) {
      return todayReadings[todayReadings.length - 1]
    }
    if (recentReadings.length > 0) {
      return recentReadings[0]
    }
    return null
  }, [todayReadings, recentReadings])

  const avgCategory = getReportClinicalCategory(todayAverage)
  const avgVariant = getReportCategoryVariant(avgCategory)
  const avgLabel = getReportCategoryLabel(avgCategory)

  // Unauthenticated Welcome Landing View
  if (!isAuthenticated) {
    return (
      <div className="space-y-10">
        {/* Patient Welcome Hero */}
        <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-md relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-medium mb-4">
              Personal Blood Glucose Companion
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Manage Your Blood Glucose with Confidence
            </h1>
            <p className="text-teal-100/90 text-base sm:text-lg leading-relaxed mb-8">
              Sweety provides a calm, clear interface to log your daily blood glucose readings,
              monitor clinical trends across meal slots, and keep your metabolic health on track.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button
                  variant="secondary"
                  size="md"
                  className="font-semibold bg-white text-teal-900 hover:bg-teal-50 shadow-xs"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="md"
                  className="border-teal-300/40 text-teal-900 hover:bg-teal-700/50"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        </section>

        {/* Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <CardTitle>Daily Meal Slots</CardTitle>
              <CardDescription>
                Record glucose levels at morning fasting, post-breakfast, post-lunch, and post-dinner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Organized meal slots provide clinical context, distinguishing fasting levels from post-meal metabolic responses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle>Clear Analytics</CardTitle>
              <CardDescription>
                Understand patterns with accessible daily curves and monthly distribution summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Visual indicators help you spot trends early, review averages, and share structured records with your doctor.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle>Private & Isolated</CardTitle>
              <CardDescription>
                Your health records are strictly private and accessible only through your authenticated account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Built with industry-standard authentication safeguards and strict database isolation for personal health security.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  // Authenticated Patient Health Overview
  const greetingName = user?.name || user?.email.split('@')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Patient Welcome Header */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Personal Health Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {greetingName}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Here is your blood glucose overview for today, {formatDateOnly(today)}. Logging your
              readings consistently helps maintain healthy glycemic balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/readings">
              <Button
                variant="primary"
                size="md"
                leftIcon={
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                }
              >
                Log Glucose Reading
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" size="md">
                View Reports
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Loading or Error State */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-500 py-1">
            <Spinner size="sm" className="text-teal-600" />
            <p className="text-sm font-medium text-slate-600">Getting your latest readings…</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton variant="card" height="110px" />
            <Skeleton variant="card" height="110px" />
            <Skeleton variant="card" height="110px" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <Skeleton height="20px" width="140px" />
              <Skeleton variant="card" height="160px" />
            </div>
            <div className="space-y-3">
              <Skeleton height="20px" width="120px" />
              <Skeleton variant="card" height="160px" />
            </div>
          </div>
        </div>
      ) : loadError ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="p-6 text-center text-sm text-rose-700 flex flex-col items-center justify-center gap-3">
            <p>{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetryTrigger((c) => c + 1)}
              className="border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Glycemic Snapshot */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Today&apos;s Snapshot</h2>
                <p className="text-xs text-slate-500">Summary of readings recorded today</p>
              </div>
              <Badge variant={todayCount > 0 ? 'success' : 'neutral'} size="sm">
                {todayCount} of 4 Slots Logged
              </Badge>
            </div>

            {todayCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Metric 1: Readings Logged */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-slate-500">
                      Readings Today
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-slate-900 tabular-nums">
                      {todayCount}{' '}
                      <span className="text-sm font-normal text-slate-400">/ 4 slots</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className="bg-teal-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${(todayCount / 4) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 2: Today's Average */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium text-slate-500">
                        Today&apos;s Average
                      </CardDescription>
                      {todayAverage !== null && (
                        <Badge variant={avgVariant} size="sm">
                          {avgLabel}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 tabular-nums">
                      {todayAverage !== null ? `${todayAverage} ` : '— '}
                      <span className="text-sm font-normal text-slate-400">mg/dL</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xs text-slate-400 mt-2">
                      Clinical reference: 70–99 mg/dL fasting, &lt; 140 post-meal
                    </p>
                  </CardContent>
                </Card>

                {/* Metric 3: Latest Reading */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-slate-500">
                      Most Recent Reading
                    </CardDescription>
                    {latestReading ? (
                      <div className="flex items-center justify-between mt-1">
                        <ReadingSlotBadge slot={latestReading.slot} size="sm" />
                        <GlucoseValue value={latestReading.glucoseValue} size="sm" />
                      </div>
                    ) : (
                      <CardTitle className="text-2xl font-bold text-slate-900">—</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {latestReading && (
                      <p className="text-2xs text-slate-400 mt-2">
                        Recorded at {formatTime(latestReading.createdAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Prompt when no readings logged today */
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">No readings recorded today yet</h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                      Logging your morning fasting glucose or post-breakfast reading gives you a baseline for the day.
                    </p>
                  </div>
                </div>
                <Link to="/readings" className="shrink-0">
                  <Button variant="primary" size="sm">
                    + Log First Reading
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Recent Activity & Reports Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Readings List (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Recent Readings</h2>
                <Link
                  to="/readings"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                >
                  View All &rarr;
                </Link>
              </div>

              {recentReadings.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  {recentReadings.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ReadingSlotBadge slot={r.slot} size="sm" />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 block">
                            {formatDateOnly(r.date)}
                          </span>
                          <span className="text-2xs text-slate-400">
                            Logged at {formatTime(r.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                        <GlucoseValue value={r.glucoseValue} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 text-slate-500 text-xs">
                  No readings logged yet. Add your first reading to start tracking your glucose.
                </div>
              )}
            </div>

            {/* Quick Navigation / Clinical Insights Card (1 col on lg) */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Analytics & Trends</h2>
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-base">Glycemic Reports</CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive summaries across Daily, Month-to-Date, and Previous-Month periods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-slate-500 space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Visual slot curves & meal responses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Monthly averages & glycemic spread
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Statistical summaries for your doctor
                    </li>
                  </ul>
                  <Link to="/reports">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                      Open Reports &rarr;
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
