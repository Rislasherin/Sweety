import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import { ReadingSlotBadge } from '@/features/readings/components/atoms/ReadingSlotBadge'
import { GlucoseValue } from '@/features/readings/components/atoms/GlucoseValue'
import { getReadingSlotDescription } from '@/features/readings/utils/readingValidation'
import { READING_SLOTS, type ReadingSlotType } from '@/features/readings/types'
import type { DailyReportReadingItem } from '../../types'

export interface DailyReadingsTableProps {
  readings: DailyReportReadingItem[]
  date: string
  className?: string
}

export const DailyReadingsTable: React.FC<DailyReadingsTableProps> = ({
  readings,
  date,
  className,
}) => {
  const readingMap = new Map<ReadingSlotType, DailyReportReadingItem>()
  for (const r of readings) {
    readingMap.set(r.slot, r)
  }

  const formatRecordedTime = (isoString?: string): string => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Daily Readings Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Detailed breakdown of meal slots for {date}
            </CardDescription>
          </div>
          <Badge variant="neutral" size="sm">
            {readings.length} of 4 Recorded
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y divide-slate-100">
          {READING_SLOTS.map((slot) => {
            const item = readingMap.get(slot)
            const description = getReadingSlotDescription(slot)
            const recordedTime = item ? formatRecordedTime(item.createdAt) : null

            return (
              <div
                key={slot}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-1 last:pb-1"
              >
                {/* Slot identification */}
                <div className="flex items-start sm:items-center gap-3">
                  <ReadingSlotBadge slot={slot} />
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">{description}</span>
                    {recordedTime && (
                      <span className="text-2xs text-slate-400">Logged at {recordedTime}</span>
                    )}
                  </div>
                </div>

                {/* Slot reading state */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                  {item ? (
                    <GlucoseValue value={item.glucoseValue} size="md" />
                  ) : (
                    <Badge variant="neutral" size="sm" className="text-slate-400 border-dashed">
                      Not logged for this day
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
