'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { IHeatmapDay } from '@/types'
import { formatCurrency } from '@/lib/formatters'

interface HeatmapCalendarProps {
  data: IHeatmapDay[]
  maxTotal: number
  year: number
  currency?: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getCellColor(total: number, maxTotal: number): string {
  if (total === 0) return 'bg-slate-100 dark:bg-slate-800'
  const intensity = total / maxTotal
  if (intensity < 0.15) return 'bg-primary-200 dark:bg-primary-900'
  if (intensity < 0.35) return 'bg-primary-300 dark:bg-primary-800'
  if (intensity < 0.6)  return 'bg-primary-400 dark:bg-primary-700'
  if (intensity < 0.85) return 'bg-primary-500 dark:bg-primary-600'
  return 'bg-primary-600 dark:bg-primary-500'
}

export function HeatmapCalendar({ data, maxTotal, year, currency = 'USD' }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ day: IHeatmapDay; x: number; y: number } | null>(null)

  const startDate = parseISO(`${year}-01-01`)
  const startDow = startDate.getDay()

  const grid: (IHeatmapDay | null)[][] = Array.from({ length: 7 }, () => Array(53).fill(null))
  data.forEach((day, i) => {
    const pos = i + startDow
    const col = Math.floor(pos / 7)
    const row = pos % 7
    if (col < 53) grid[row][col] = day
  })

  const monthCols: { label: string; col: number }[] = []
  MONTHS.forEach((m, mi) => {
    const firstDay = new Date(year, mi, 1)
    const pos = Math.floor((firstDay.getTime() - startDate.getTime()) / 86400000) + startDow
    monthCols.push({ label: m, col: Math.floor(pos / 7) })
  })

  return (
    <div className="w-full">
      <div className="flex gap-1 items-start">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 flex-shrink-0 w-6">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="aspect-square flex items-center text-[9px] text-slate-400 dark:text-slate-500"
              style={{ visibility: i % 2 === 0 ? 'visible' : 'hidden' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week columns — stretch to fill card width */}
        <div
          className="flex-1 grid gap-0.5"
          style={{ gridTemplateColumns: 'repeat(53, 1fr)' }}
        >
          {grid[0].map((_, col) => (
            <div key={col} className="flex flex-col gap-0.5">
              {grid.map((row, rowIdx) => {
                const day = row[col]
                if (!day) return <div key={rowIdx} className="aspect-square" />
                return (
                  <div
                    key={rowIdx}
                    className={`aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125 ${getCellColor(day.total, maxTotal)}`}
                    onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Month labels below the grid */}
      <div className="flex gap-1">
        <div className="flex-shrink-0 w-6" />
        <div
          className="flex-1 grid gap-0.5"
          style={{ gridTemplateColumns: 'repeat(53, 1fr)' }}
        >
          {monthCols.map(({ label, col }) => (
            <span
              key={label}
              className="text-[10px] text-slate-400 dark:text-slate-500 truncate"
              style={{ gridColumn: `${col + 1} / span 4` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-xs text-slate-400">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.85, 1].map((v, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${v === 0 ? 'bg-slate-100 dark:bg-slate-800' : `bg-primary-${200 + Math.min(i, 4) * 100} dark:bg-primary-${900 - Math.min(i, 4) * 100}`}`}
          />
        ))}
        <span className="text-xs text-slate-400">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {format(parseISO(tooltip.day.date), 'MMMM d, yyyy')}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            {formatCurrency(tooltip.day.total, currency)} · {tooltip.day.count} transactions
          </p>
        </div>
      )}
    </div>
  )
}
