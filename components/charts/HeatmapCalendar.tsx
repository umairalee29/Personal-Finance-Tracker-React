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
  if (intensity < 0.6) return 'bg-primary-400 dark:bg-primary-700'
  if (intensity < 0.85) return 'bg-primary-500 dark:bg-primary-600'
  return 'bg-primary-600 dark:bg-primary-500'
}

export function HeatmapCalendar({ data, maxTotal, year, currency = 'USD' }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ day: IHeatmapDay; x: number; y: number } | null>(null)

  // Build 7-row × 53-col grid
  const startDate = parseISO(`${year}-01-01`)
  const startDow = startDate.getDay() // 0=Sun

  const grid: (IHeatmapDay | null)[][] = Array.from({ length: 7 }, () => Array(53).fill(null))
  data.forEach((day, i) => {
    const pos = i + startDow
    const col = Math.floor(pos / 7)
    const row = pos % 7
    if (col < 53) grid[row][col] = day
  })

  // Month label positions
  const monthCols: { label: string; col: number }[] = []
  MONTHS.forEach((m, mi) => {
    const firstDay = new Date(year, mi, 1)
    const pos = Math.floor((firstDay.getTime() - startDate.getTime()) / (86400000)) + startDow
    const col = Math.floor(pos / 7)
    monthCols.push({ label: m, col })
  })

  const cellSize = 12
  const gap = 2

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[700px]">
        {/* Month labels */}
        <div className="flex mb-1 pl-8">
          {monthCols.map(({ label, col }) => (
            <span
              key={label}
              className="absolute text-xs text-slate-400 dark:text-slate-500"
              style={{ left: `${32 + col * (cellSize + gap)}px` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5 mt-5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS.map((d, i) => (
              <span
                key={d}
                className="text-xs text-slate-400 dark:text-slate-500"
                style={{ height: cellSize, lineHeight: `${cellSize}px`, visibility: i % 2 === 0 ? 'visible' : 'hidden' }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grid */}
          {grid[0].map((_, col) => (
            <div key={col} className="flex flex-col gap-0.5">
              {grid.map((row, rowIdx) => {
                const day = row[col]
                if (!day) return <div key={rowIdx} style={{ width: cellSize, height: cellSize }} />
                return (
                  <div
                    key={rowIdx}
                    style={{ width: cellSize, height: cellSize }}
                    className={`rounded-sm cursor-pointer transition-transform hover:scale-125 ${getCellColor(day.total, maxTotal)}`}
                    onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-xs text-slate-400">Less</span>
          {[0, 0.2, 0.4, 0.6, 0.85, 1].map((v, i) => (
            <div
              key={i}
              style={{ width: cellSize, height: cellSize }}
              className={`rounded-sm ${v === 0 ? 'bg-slate-100 dark:bg-slate-800' : `bg-primary-${200 + Math.min(i, 4) * 100} dark:bg-primary-${900 - Math.min(i, 4) * 100}`}`}
            />
          ))}
          <span className="text-xs text-slate-400">More</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none
                       bg-white dark:bg-slate-800 rounded-lg shadow-lg
                       border border-slate-200 dark:border-slate-700
                       px-3 py-2 text-sm"
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
    </div>
  )
}
