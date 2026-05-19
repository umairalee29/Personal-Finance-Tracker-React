'use client'

import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/formatters'
import type { ICategoryBreakdown } from '@/types'

interface SpendingPieChartProps {
  data: ICategoryBreakdown[]
  currency?: string
  height?: number
  donut?: boolean
}

function CustomTooltip({ active, payload, currency }: {
  active?: boolean
  payload?: Array<{ payload: ICategoryBreakdown }>
  currency?: string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span>{item.icon}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{item.category}</span>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        {formatCurrency(item.total, currency)} · {formatPercentage(item.percentage)}
      </p>
    </div>
  )
}

export function SpendingPieChart({ data, currency = 'USD', height = 260, donut = false }: SpendingPieChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
        No spending data for this period
      </div>
    )
  }

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const visible = data.filter((d) => !hidden.has(d.categoryId))

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={visible}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={donut ? 90 : 100}
            innerRadius={donut ? 50 : 0}
            paddingAngle={2}
          >
            {visible.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-wrap gap-2 justify-center mt-12">
        {data.map((entry) => {
          const isHidden = hidden.has(entry.categoryId)
          return (
            <li
              key={entry.categoryId}
              onClick={() => toggle(entry.categoryId)}
              className={`flex items-center gap-1.5 text-xs cursor-pointer select-none transition-opacity duration-200
                          ${isHidden ? 'opacity-35' : 'opacity-100'}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200"
                style={{ background: isHidden ? '#94a3b8' : entry.color }}
              />
              <span className={`text-slate-600 dark:text-slate-400 ${isHidden ? 'line-through' : ''}`}>
                {entry.icon} {entry.category}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
