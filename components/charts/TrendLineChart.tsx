'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { IMonthlyTrend } from '@/types'
import { formatCurrency } from '@/lib/formatters'

interface TrendLineChartProps {
  data: IMonthlyTrend[]
  currency?: string
  height?: number
}

const LINES = [
  { key: 'income',   label: 'Income',   color: '#10b981' },
  { key: 'expenses', label: 'Expenses', color: '#f43f5e' },
] as const

type LineKey = typeof LINES[number]['key']

function CustomTooltip({ active, payload, label, currency, hidden }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  currency?: string
  hidden: Record<LineKey, boolean>
}) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((p) => !hidden[p.name as LineKey])
  if (!visible.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {visible.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-slate-400 capitalize">{p.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>
            {formatCurrency(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendLineChart({ data, currency = 'USD', height = 260 }: TrendLineChartProps) {
  const [hidden, setHidden] = useState<Record<LineKey, boolean>>({ income: false, expenses: false })

  const toggle = (key: LineKey) =>
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <>
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
          <Tooltip content={<CustomTooltip currency={currency} hidden={hidden} />} />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5 }}
            hide={hidden.income}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#f43f5e' }}
            activeDot={{ r: 5 }}
            hide={hidden.expenses}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* External legend — outside ResponsiveContainer so it doesn't affect chart height */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {LINES.map(({ key, label, color }) => {
          const isHidden = hidden[key]
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none
                          transition-opacity duration-200 ${isHidden ? 'opacity-35' : 'opacity-100'}`}
            >
              <span
                className="w-3 h-0.5 rounded-full flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: isHidden ? '#94a3b8' : color, height: '2.5px' }}
              />
              <span className={`text-slate-600 dark:text-slate-400 ${isHidden ? 'line-through' : ''}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
