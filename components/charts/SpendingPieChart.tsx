'use client'

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

function ExternalLegend({ data }: { data: ICategoryBreakdown[] }) {
  return (
    <ul className="flex flex-wrap gap-2 justify-center mt-12">
      {data.map((entry) => (
        <li key={entry.categoryId} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span>{entry.icon} {entry.category}</span>
        </li>
      ))}
    </ul>
  )
}

export function SpendingPieChart({ data, currency = 'USD', height = 260, donut = false }: SpendingPieChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
        No spending data for this period
      </div>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={donut ? 90 : 100}
            innerRadius={donut ? 50 : 0}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <ExternalLegend data={data} />
    </>
  )
}
