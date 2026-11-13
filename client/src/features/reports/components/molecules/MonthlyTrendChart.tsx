import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import type { DailyTrendPoint } from '../../types'

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

  // Visual scale guide lines (clear numeric levels for visual tracking)
  const yTicks = [70, 100, 140].filter((val) => val >= yMin && val <= yMax)

  // Plotted points
  const points = dailyTrends.map((item, index) => {
    const x = getX(index)
    const y = getY(item.average)
    return {
      item,
      x,
      y,
    }
  })

  // Polyline points string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Shaded area under the line
  const areaPolygonPoints =
    points.length >= 2
      ? `${points[0].x},${height - padding.bottom} ${polylinePoints} ${points[points.length - 1].x},${height - padding.bottom}`
      : ''

  // Format short date helper e.g. "2026-05-01" -> "May 1"
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

          {/* Clean Series Legends */}
          <div className="flex flex-wrap items-center gap-3 text-2xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-teal-600 bg-white" />
              Daily Average
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-teal-600 rounded-full" />
              Trend Progression
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
                <th>Day Highest</th>
                <th>Day Lowest</th>
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
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.20" />
                <stop offset="60%" stopColor="#0d9488" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Scale Guide Lines */}
            {yTicks.map((tickVal) => {
              const tickY = getY(tickVal)
              return (
                <g key={`y-guide-${tickVal}`}>
                  <line
                    x1={padding.left}
                    y1={tickY}
                    x2={width - padding.right}
                    y2={tickY}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={width - padding.right + 5}
                    y={tickY + 3}
                    fontSize="9"
                    fill="#64748b"
                    fontWeight="500"
                  >
                    {tickVal}
                  </text>
                </g>
              )
            })}

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

                  {/* Outer hover ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 9 : 6}
                    fill="#0d9488"
                    fillOpacity={isHovered ? 0.28 : 0.14}
                    className="transition-all duration-150"
                  />

                  {/* Node circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 4.5 : 3.5}
                    fill="#ffffff"
                    stroke="#0d9488"
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
                transform={`translate(${Math.max(50, Math.min(width - 140, hoveredCoords.x - 70))}, ${Math.max(10, hoveredCoords.y - 55)})`}
                className="pointer-events-none"
              >
                <rect
                  width="140"
                  height="45"
                  rx="6"
                  fill="#0f172a"
                  fillOpacity="0.92"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                />
                <text x="70" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8">
                  {formatShortDate(hoveredPoint.date)} • {hoveredPoint.count} test{hoveredPoint.count !== 1 ? 's' : ''}
                </text>
                <text
                  x="70"
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

        {/* Clinical Interpretation Guidance */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-2xs text-slate-500">
          <p>
            <span className="font-semibold text-slate-700">Clinical Note:</span> Daily averages aggregate measurements across various meal slots (fasting and post-meal). Target ranges vary individually by meal timing and treatment plan. Consult your healthcare team for your personalized glycemic goals.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

