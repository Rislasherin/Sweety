import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import {
  formatStatValue,
  getReportClinicalCategory,
  getReportCategoryVariant,
  getReportCategoryLabel,
} from '../../utils/reportUtils'

export interface GlycemicSpreadGaugeProps {
  highest: number | null
  lowest: number | null
  average: number | null
  count: number
  periodTitle: string
  dateRange: string
  className?: string
}

export const GlycemicSpreadGauge: React.FC<GlycemicSpreadGaugeProps> = ({
  highest,
  lowest,
  average,
  count,
  periodTitle,
  dateRange,
  className,
}) => {
  const hasData = count > 0 && highest !== null && lowest !== null && average !== null

  // SVG dimensions
  const width = 640
  const height = 180
  const padding = { left: 45, right: 45, top: 40, bottom: 40 }
  const barWidth = width - padding.left - padding.right
  const barY = 85
  const barHeight = 16

  // Scale bounds
  const minBound = Math.min(40, lowest !== null ? Math.floor((lowest - 15) / 10) * 10 : 40)
  const maxBound = Math.max(220, highest !== null ? Math.ceil((highest + 20) / 20) * 20 : 220)

  const getX = (val: number): number => {
    const clamped = Math.max(minBound, Math.min(maxBound, val))
    return padding.left + ((clamped - minBound) / (maxBound - minBound)) * barWidth
  }

  // Clinical zone x-coordinates
  const x70 = getX(70)
  const x100 = getX(100)
  const x126 = getX(126)

  const avgCategory = getReportClinicalCategory(average)
  const avgVariant = getReportCategoryVariant(avgCategory)
  const avgLabel = getReportCategoryLabel(avgCategory)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{periodTitle} Glycemic Spread & Distribution</span>
              {hasData && (
                <Badge variant={avgVariant} size="sm">
                  Average: {avgLabel}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Aggregated glycemic span (Lowest, Average, and Highest readings) for {dateRange}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <span className="font-semibold text-slate-700">{count}</span> total readings analyzed
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Screen-reader accessible transcript */}
        <div className="sr-only">
          <h4>{periodTitle} Glycemic Distribution</h4>
          <p>Period: {dateRange}</p>
          <p>Total readings: {count}</p>
          <p>Lowest reading: {formatStatValue(lowest)}</p>
          <p>
            Average reading: {formatStatValue(average)} ({avgLabel})
          </p>
          <p>Highest reading: {formatStatValue(highest)}</p>
        </div>

        {hasData ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[500px] select-none"
              role="img"
              aria-label={`Glycemic spread from ${lowest} to ${highest} mg/dL with average ${average} mg/dL`}
            >
              <title>{periodTitle} Glycemic Spread Gauge</title>
              <desc>
                Horizontal distribution gauge illustrating the lowest, average, and highest glucose
                readings mapped against clinical thresholds.
              </desc>

              {/* Background Reference Track Segments */}
              {/* Hypo (< 70) */}
              <rect
                x={padding.left}
                y={barY}
                width={Math.max(0, x70 - padding.left)}
                height={barHeight}
                rx="4"
                fill="#fde68a"
                fillOpacity="0.7"
              />
              {/* Normal (70 - 100) */}
              <rect
                x={x70}
                y={barY}
                width={Math.max(0, x100 - x70)}
                height={barHeight}
                fill="#a7f3d0"
                fillOpacity="0.8"
              />
              {/* Elevated (100 - 126) */}
              <rect
                x={x100}
                y={barY}
                width={Math.max(0, x126 - x100)}
                height={barHeight}
                fill="#fef08a"
                fillOpacity="0.8"
              />
              {/* High (>= 126) */}
              <rect
                x={x126}
                y={barY}
                width={Math.max(0, width - padding.right - x126)}
                height={barHeight}
                rx="4"
                fill="#fecdd3"
                fillOpacity="0.8"
              />

              {/* Threshold Labels Under Bar */}
              <text x={padding.left} y={barY + barHeight + 14} fontSize="9" fill="#94a3b8">
                {minBound}
              </text>
              <text
                x={x70}
                y={barY + barHeight + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#d97706"
              >
                70 (Low)
              </text>
              <text
                x={x100}
                y={barY + barHeight + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#059669"
              >
                100 (Normal)
              </text>
              <text
                x={x126}
                y={barY + barHeight + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#e11d48"
              >
                126 (High)
              </text>
              <text
                x={width - padding.right}
                y={barY + barHeight + 14}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
              >
                {maxBound}
              </text>

              {/* User Reading Range Capsule / Spread Bar */}
              {lowest !== null && highest !== null && (
                <g>
                  <rect
                    x={getX(lowest)}
                    y={barY - 3}
                    width={Math.max(4, getX(highest) - getX(lowest))}
                    height={barHeight + 6}
                    rx="6"
                    fill="#0f766e"
                    fillOpacity="0.3"
                    stroke="#0f766e"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Lowest Marker */}
              {lowest !== null && (
                <g>
                  <line
                    x1={getX(lowest)}
                    y1={barY - 14}
                    x2={getX(lowest)}
                    y2={barY + barHeight + 4}
                    stroke="#0284c7"
                    strokeWidth="2"
                  />
                  <circle cx={getX(lowest)} cy={barY - 14} r="4" fill="#0284c7" />
                  <text
                    x={getX(lowest)}
                    y={barY - 22}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0369a1"
                  >
                    Min {lowest}
                  </text>
                </g>
              )}

              {/* Highest Marker */}
              {highest !== null && (
                <g>
                  <line
                    x1={getX(highest)}
                    y1={barY - 14}
                    x2={getX(highest)}
                    y2={barY + barHeight + 4}
                    stroke="#e11d48"
                    strokeWidth="2"
                  />
                  <circle cx={getX(highest)} cy={barY - 14} r="4" fill="#e11d48" />
                  <text
                    x={getX(highest)}
                    y={barY - 22}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#be123c"
                  >
                    Max {highest}
                  </text>
                </g>
              )}

              {/* Average Diamond Marker */}
              {average !== null && (
                <g>
                  <line
                    x1={getX(average)}
                    y1={barY - 28}
                    x2={getX(average)}
                    y2={barY + barHeight + 8}
                    stroke="#0d9488"
                    strokeWidth="2.5"
                    strokeDasharray="2 2"
                  />
                  {/* Diamond at top */}
                  <polygon
                    points={`${getX(average)},${barY - 32} ${getX(average) + 6},${barY - 26} ${getX(average)},${barY - 20} ${getX(average) - 6},${barY - 26}`}
                    fill="#0d9488"
                  />
                  <rect
                    x={getX(average) - 32}
                    y={barY - 48}
                    width="64"
                    height="16"
                    rx="3"
                    fill="#0f172a"
                  />
                  <text
                    x={getX(average)}
                    y={barY - 36}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    Avg {average}
                  </text>
                </g>
              )}
            </svg>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            No readings recorded for this aggregation period to render the glycemic spread gauge.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
