'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import type { IBudget } from '@/types'
import { formatCurrency } from '@/lib/formatters'

interface BudgetBarChartProps {
  budgets: (IBudget & { spentAmount: number; percentageUsed: number })[]
  currency?: string
  height?: number
}

export function BudgetBarChart({ budgets, currency = 'USD', height = 220 }: BudgetBarChartProps) {
  const data = budgets.map((b) => ({
    name: b.name,
    spent: b.spentAmount,
    remaining: Math.max(0, b.limit - b.spentAmount),
    limit: b.limit,
    pct: b.percentageUsed,
  }))

  const colors = data.map((d) =>
    d.pct >= 90 ? '#f43f5e' : d.pct >= 60 ? '#f59e0b' : '#10b981'
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          type="number"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => formatCurrency(v, currency, true)}
          className="fill-slate-500"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          className="fill-slate-600 dark:fill-slate-300"
          width={90}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v: number, name: string) => [formatCurrency(v, currency), name === 'spent' ? 'Spent' : 'Remaining']}
          contentStyle={{ borderRadius: '0.75rem', fontSize: '0.875rem' }}
        />
        <Bar dataKey="spent" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
