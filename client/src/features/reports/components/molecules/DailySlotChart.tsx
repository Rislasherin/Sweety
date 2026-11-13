import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import { READING_SLOT_ORDER, formatReadingSlot } from '@/features/readings/utils/readingValidation'
import { READING_SLOTS, type ReadingSlotType } from '@/features/readings/types'
import type { DailyReportReadingItem } from '../../types'
import { getReportClinicalCategory, getReportCategoryLabel } from '../../utils/reportUtils'

export interface DailySlotChartProps {
  readings: DailyReportReadingItem[]
  date: string
  className?: string
}

interface SlotPoint {
  slot: ReadingSlotType
  label: string
  reading?: DailyReportReadingItem
  x: number
  y: number | null
}

export const DailySlotChart: React.FC<DailySlotChartProps> = ({ readings, date, className }) => {
  // SVG Canvas dimensions
  const width = 640
  const height = 260
  const padding = { top: 35, right: 50, bottom: 45, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Map readings by slot
  const readingBySlot = new Map<ReadingSlotType, DailyReportReadingItem>()
  for (const r of readings) {
    readingBySlot.set(r.slot, r)
  }

  // Determine dynamic Y bounds based on readings
  const values = readings.map((r) => r.glucoseValue)
  const minVal = values.length > 0 ? Math.min(...values) : 70
  const maxVal = values.length > 0 ? Math.max(...values) : 130

  const yMin = Math.max(40, Math.min(50, Math.floor((minVal - 15) / 10) * 10))
  const yMax = Math.max(200, Math.ceil((maxVal + 25) / 20) * 20)

  const getY = (val: number): number => {
    const clamped = Math.max(yMin, Math.min(yMax, val))
    return padding.top + ((yMax - clamped) / (yMax - yMin)) * chartHeight
  }

  // Calculate 4 canonical slot positions
  const slots: SlotPoint[] = READING_SLOTS.map((slot) => {
    const index = READING_SLOT_ORDER[slot]
    // 4 evenly spaced columns
    const x = padding.left + (chartWidth / 4) * (index + 0.5)
    const reading = readingBySlot.get(slot)
    const y = reading ? getY(reading.glucoseValue) : null

    return {
      slot,
      label: formatReadingSlot(slot),
      reading,
      x,
      y,
    }
  })

  // Reference lines
  const normalLowY = getY(70)
  const normalHighY = getY(100)
  const highThresholdY = getY(126)

  // Points that have data for line path
  const plottedPoints = slots.filter(
    (s): s is SlotPoint & { y: number; reading: DailyReportReadingItem } =>
      s.y !== null && !!s.reading
  )

  // Construct SVG polyline points string
  const polylinePoints = plottedPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Daily Meal Slot Glucose Curve</span>
              <Badge variant="neutral" size="sm">
                {readings.length} / 4 Slots Recorded
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Visualizes blood glucose progression across canonical daily meal slots for {date}
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
        {/* Accessible screen-reader summary */}
        <div className="sr-only">
          <h4>Daily glucose readings table for {date}</h4>
          <table>
            <thead>
              <tr>
                <th>Meal Slot</th>
                <th>Status</th>
                <th>Glucose (mg/dL)</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.slot}>
                  <td>{s.label}</td>
                  <td>{s.reading ? 'Recorded' : 'Not recorded'}</td>
                  <td>{s.reading ? s.reading.glucoseValue : '—'}</td>
                  <td>
                    {s.reading
                      ? getReportCategoryLabel(getReportClinicalCategory(s.reading.glucoseValue))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scalable Vector Graphic */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[500px] select-none"
            role="img"
            aria-label={`Daily glucose curve for ${date} showing ${readings.length} readings across 4 meal slots`}
          >
            <title>Daily Meal Slot Glucose Curve</title>
            <desc>
              Interactive and accessible SVG line chart showing glucose values at Morning, After
              Breakfast, After Lunch, and After Dinner.
            </desc>

            {/* Definitions: Gradients and drop shadows */}
            <defs>
              <linearGradient id="normalBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="elevatedBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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
              fill="url(#normalBandGrad)"
              className="transition-all"
            />

            {/* Elevated Range Reference Band (100 - 126 mg/dL) */}
            <rect
              x={padding.left}
              y={highThresholdY}
              width={chartWidth}
              height={Math.max(0, normalHighY - highThresholdY)}
              fill="url(#elevatedBandGrad)"
              className="transition-all"
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

            {/* Vertical grid lines for each slot */}
            {slots.map((s) => (
              <line
                key={`grid-${s.slot}`}
                x1={s.x}
                y1={padding.top}
                x2={s.x}
                y2={height - padding.bottom}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}

            {/* Connecting curve / polyline if at least 2 points exist */}
            {plottedPoints.length >= 2 && (
              <polyline
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            {/* X-axis Slot Labels */}
            {slots.map((s) => (
              <g key={`label-${s.slot}`}>
                <text
                  x={s.x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#334155"
                >
                  {s.label}
                </text>
                <text
                  x={s.x}
                  y={height - padding.bottom + 30}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94a3b8"
                >
                  {s.reading ? 'Recorded' : 'Empty'}
                </text>
              </g>
            ))}

            {/* Render Slot Nodes */}
            {slots.map((s) => {
              if (!s.reading || s.y === null) {
                // Ghost point for missing slot
                return (
                  <circle
                    key={`ghost-${s.slot}`}
                    cx={s.x}
                    cy={normalHighY}
                    r="4"
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )
              }

              const category = getReportClinicalCategory(s.reading.glucoseValue)
              let nodeColor = '#10b981' // normal
              if (category === 'LOW') nodeColor = '#f59e0b'
              else if (category === 'ELEVATED') nodeColor = '#eab308'
              else if (category === 'HIGH') nodeColor = '#ef4444'

              return (
                <g key={`point-${s.slot}`}>
                  {/* Outer pulse ring */}
                  <circle cx={s.x} cy={s.y} r="10" fill={nodeColor} fillOpacity="0.18" />
                  {/* Main Node circle */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="5"
                    fill="#ffffff"
                    stroke={nodeColor}
                    strokeWidth="3"
                  />
                  {/* Value tag above node */}
                  <rect
                    x={s.x - 24}
                    y={s.y - 25}
                    width="48"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    fillOpacity="0.85"
                  />
                  <text
                    x={s.x}
                    y={s.y - 13}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {s.reading.glucoseValue}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
