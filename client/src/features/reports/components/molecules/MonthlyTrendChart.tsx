import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import type { DailyTrendPoint } from '../../types'
import {
  getReportClinicalCategory,
  getReportCategoryLabel,
} from '../../utils/reportUtils'

export interface MonthlyTrendChartProps {
  dailyTrends: DailyTrendPoint[]
  periodTitle: string
  dateRange: string
  className?: string
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  dailyTrends,
  periodTitle,
  dateRange,
  className,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrendPoint | null>(null)
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null)

  // Chart dimensions
  const width = 720
  const height = 280
  const padding = { top: 35, right: 55, bottom: 45, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Edge case: no data
  if (!dailyTrends || dailyTrends.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
            {periodTitle} Daily-Average Glucose Trend
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Daily blood glucose averages over {dateRange}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-500">
            No daily trend data available for this reporting period.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Determine dynamic Y-axis bounds
  const averages = dailyTrends.map((d) => d.average)
  const minAvg = Math.min(...averages)
  const maxAvg = Math.max(...averages)

  const yMin = Math.max(40, Math.min(60, Math.floor((minAvg - 15) / 10) * 10))
  const yMax = Math.max(180, Math.ceil((maxAvg + 25) / 20) * 20)

  const getY = (val: number): number => {
    const clamped = Math.max(yMin, Math.min(yMax, val))
    return padding.top + ((yMax - clamped) / (yMax - yMin)) * chartHeight
  }

  // Calculate X positions
  const count = dailyTrends.length
  const getX = (index: number): number => {
    if (count === 1) {
      return padding.left + chartWidth / 2
    }
    return padding.left + (index / (count - 1)) * chartWidth
  }

  // Key reference line heights
  const normalLowY = getY(70)
  const normalHighY = getY(100)
  const highThresholdY = getY(126)

  // Plotted points
  const points = dailyTrends.map((item, index) => {
    const x = getX(index)
    const y = getY(item.average)
    return {
      item,
      x,
      y,
      category: getReportClinicalCategory(item.average),
    }
  })

  // Polyline points string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Shaded area under the line
  const areaPolygonPoints =
    points.length >= 2
      ? `${points[0].x},${height - padding.bottom} ${polylinePoints} ${points[points.length - 1].x},${height - padding.bottom}`
      : ''

  // Format short date helper e.g. "2026-05-01" -> "May 1" or "05/01"
  const formatShortDate = (dateStr: string): string => {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10)
      const dayNum = parseInt(parts[2], 10)
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return `${monthNames[monthNum - 1]} ${dayNum}`
    }
    return dateStr
  }

  // Determine which X-axis ticks to display to avoid label overlap
  const tickInterval = count <= 8 ? 1 : count <= 16 ? 2 : Math.ceil(count / 8)

  return (
    <Card className={className} data-testid="monthly-trend-chart-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{periodTitle} Daily Glucose Trend</span>
              <Badge variant="neutral" size="sm">
                {count} Active Day{count !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daily-average blood glucose progression over {dateRange}
            </CardDescription>
          </div>

          {/* Reference legends */}
          <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Normal (70–99)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Elevated (100–125)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              High (≥ 126)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Screen-reader accessible data table */}
        <div className="sr-only">
          <h4>{periodTitle} daily glucose averages for {dateRange}</h4>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Daily Average (mg/dL)</th>
                <th>Readings Count</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Clinical Reference</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrends.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.average}</td>
                  <td>{d.count}</td>
                  <td>{d.highest}</td>
                  <td>{d.lowest}</td>
                  <td>{getReportCategoryLabel(getReportClinicalCategory(d.average))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SVG Visualization */}
        <div className="w-full overflow-x-auto relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[550px] select-none"
            role="img"
            aria-label={`${periodTitle} daily glucose trend chart for ${dateRange} with ${count} active days`}
          >
            <title>{periodTitle} Daily-Average Glucose Trend</title>
            <desc>
              Line chart tracking daily average blood glucose progression across {dateRange}.
            </desc>

            <defs>
              {/* Gradient for area fill beneath line */}
              <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#0d9488" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.00" />
              </linearGradient>

              {/* Normal band gradient (70 - 100 mg/dL) */}
              <linearGradient id="trendNormalBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
              </linearGradient>

              {/* Elevated band gradient (100 - 126 mg/dL) */}
              <linearGradient id="trendElevatedBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Normal Range Reference Band (70 - 100 mg/dL) */}
            <rect
              x={padding.left}
              y={normalHighY}
              width={chartWidth}
              height={Math.max(0, normalLowY - normalHighY)}
              fill="url(#trendNormalBandGrad)"
            />

            {/* Elevated Range Reference Band (100 - 126 mg/dL) */}
            <rect
              x={padding.left}
              y={highThresholdY}
              width={chartWidth}
              height={Math.max(0, normalHighY - highThresholdY)}
              fill="url(#trendElevatedBandGrad)"
            />

            {/* Threshold Guide Lines */}
            {/* High Threshold: 126 mg/dL */}
            <line
              x1={padding.left}
              y1={highThresholdY}
              x2={width - padding.right}
              y2={highThresholdY}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
            <text
              x={width - padding.right + 5}
              y={highThresholdY + 3}
              fontSize="9"
              fill="#e11d48"
              fontWeight="600"
            >
              126
            </text>

            {/* Normal Upper Threshold: 100 mg/dL */}
            <line
              x1={padding.left}
              y1={normalHighY}
              x2={width - padding.right}
              y2={normalHighY}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <text
              x={width - padding.right + 5}
              y={normalHighY + 3}
              fontSize="9"
              fill="#059669"
              fontWeight="600"
            >
              100
            </text>

            {/* Low Threshold: 70 mg/dL */}
            <line
              x1={padding.left}
              y1={normalLowY}
              x2={width - padding.right}
              y2={normalLowY}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
            <text
              x={width - padding.right + 5}
              y={normalLowY + 3}
              fontSize="9"
              fill="#d97706"
              fontWeight="600"
            >
              70
            </text>

            {/* Y-axis baseline */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            {/* X-axis baseline */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            {/* Shaded Area Under Curve */}
            {points.length >= 2 && (
              <polygon
                fill="url(#trendAreaGrad)"
                points={areaPolygonPoints}
                className="transition-all"
              />
            )}

            {/* Connecting Polyline Curve */}
            {points.length >= 2 && (
              <polyline
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
                className="transition-all"
              />
            )}

            {/* Vertical grid lines & X-axis date labels */}
            {points.map((p, index) => {
              const shouldShowLabel =
                index === 0 ||
                index === points.length - 1 ||
                index % tickInterval === 0

              return (
                <g key={`x-tick-${p.item.date}`}>
                  <line
                    x1={p.x}
                    y1={padding.top}
                    x2={p.x}
                    y2={height - padding.bottom}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  {shouldShowLabel && (
                    <text
                      x={p.x}
                      y={height - padding.bottom + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill="#64748b"
                    >
                      {formatShortDate(p.item.date)}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Data Point Markers */}
            {points.map((p) => {
              let nodeColor = '#10b981' // normal
              if (p.category === 'LOW') nodeColor = '#f59e0b'
              else if (p.category === 'ELEVATED') nodeColor = '#eab308'
              else if (p.category === 'HIGH') nodeColor = '#ef4444'

              const isHovered = hoveredPoint?.date === p.item.date
              const showAlwaysTag = points.length <= 10

              return (
                <g
                  key={`point-${p.item.date}`}
                  className="cursor-pointer group"
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.item.date}: Daily average ${p.item.average} mg/dL across ${p.item.count} reading${p.item.count !== 1 ? 's' : ''}`}
                  onMouseEnter={() => {
                    setHoveredPoint(p.item)
                    setHoveredCoords({ x: p.x, y: p.y })
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null)
                    setHoveredCoords(null)
                  }}
                  onFocus={() => {
                    setHoveredPoint(p.item)
                    setHoveredCoords({ x: p.x, y: p.y })
                  }}
                  onBlur={() => {
                    setHoveredPoint(null)
                    setHoveredCoords(null)
                  }}
                >
                  {/* Invisible hit area for easier mouse targeting */}
                  <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                  {/* Outer pulse / hover ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 9 : 6}
                    fill={nodeColor}
                    fillOpacity={isHovered ? 0.3 : 0.15}
                    className="transition-all duration-150"
                  />

                  {/* Node circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 4.5 : 3.5}
                    fill="#ffffff"
                    stroke={nodeColor}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-150"
                  />

                  {/* Static value tag if <= 10 points */}
                  {showAlwaysTag && !isHovered && (
                    <text
                      x={p.x}
                      y={p.y - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="#334155"
                    >
                      {p.item.average}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Hovered / Focused Tooltip rendered inside SVG */}
            {hoveredPoint && hoveredCoords && (
              <g
                transform={`translate(${Math.max(50, Math.min(width - 130, hoveredCoords.x - 60))}, ${Math.max(10, hoveredCoords.y - 55)})`}
                className="pointer-events-none"
              >
                <rect
                  width="120"
                  height="45"
                  rx="6"
                  fill="#0f172a"
                  fillOpacity="0.92"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                />
                <text x="60" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8">
                  {formatShortDate(hoveredPoint.date)} ({hoveredPoint.count} test{hoveredPoint.count !== 1 ? 's' : ''})
                </text>
                <text
                  x="60"
                  y="34"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {hoveredPoint.average} mg/dL
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Informational Clinical Guidelines Disclaimer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-2xs text-slate-500">
          <p>
            <span className="font-semibold text-slate-600">Reference Guidelines:</span> Fasting normal: 70–99 mg/dL | Elevated: 100–125 mg/dL | High: ≥ 126 mg/dL.
          </p>
          <p className="text-slate-400">
            Averages are clinical reference guidelines, not medical diagnoses.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
