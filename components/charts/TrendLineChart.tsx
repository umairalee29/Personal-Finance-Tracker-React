'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { IMonthlyTrend } from '@/types'
import { formatCurrency } from '@/lib/formatters'

interface TrendLineChartProps {
  data: IMonthlyTrend[]
  currency?: string
  height?: number
}

function CustomTooltip({ active, payload, label, currency }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  currency?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-slate-400 capitalize">{p.name}:</span>
          <span className="font-semibold tabular" style={{ color: p.color }}>
            {formatCurrency(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendLineChart({ data, currency = 'USD', height = 260 }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          className="fill-slate-500 dark:fill-slate-400"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-slate-500 dark:fill-slate-400"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, currency, true)}
          width={60}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(v) => <span className="capitalize">{v}</span>}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#10b981' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#f43f5e"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#f43f5e' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
