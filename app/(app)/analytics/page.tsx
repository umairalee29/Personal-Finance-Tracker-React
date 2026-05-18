'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSummary, useTrends, useCategoryBreakdown, useHeatmap } from '@/hooks/useAnalytics'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import { formatCurrency, formatPercentage, getDeltaColor, formatDelta } from '@/lib/formatters'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

type Tab = 'overview' | 'trends' | 'categories' | 'heatmap'
type Range = '1m' | '3m' | '6m' | '12m'
type TrendPeriod = '3m' | '6m' | '12m'

function getDateRange(range: Range) {
  const now = new Date()
  const months = range === '12m' ? 12 : range === '6m' ? 6 : range === '3m' ? 3 : 1
  return {
    startDate: format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '1m', label: 'This Month' },
  { value: '3m', label: 'Last 3M' },
  { value: '6m', label: 'Last 6M' },
  { value: '12m', label: 'Last 12M' },
]

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const [tab, setTab] = useState<Tab>('overview')
  const [range, setRange] = useState<Range>('1m')
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('6m')
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear())

  const { startDate, endDate } = getDateRange(range)
  const { summary, isLoading: summaryLoading } = useSummary(startDate, endDate)
  const { trends, isLoading: trendsLoading } = useTrends(trendPeriod)
  const { categories, total: catTotal, isLoading: catsLoading } = useCategoryBreakdown(startDate, endDate)
  const { data: heatmapData, maxTotal, isLoading: heatmapLoading } = useHeatmap(heatmapYear)

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'categories', label: 'Categories', icon: '🥧' },
    { id: 'heatmap', label: 'Heatmap', icon: '🗓' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">Analytics</h2>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <span>{icon}</span>
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Range selector */}
          <div className="flex gap-2">
            {RANGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${range === value ? 'bg-primary text-white' : 'btn-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Income', value: formatCurrency(summary?.totalIncome ?? 0, currency), icon: '💚', color: 'text-emerald-600' },
                { label: 'Total Expenses', value: formatCurrency(summary?.totalExpenses ?? 0, currency), icon: '❤️', color: 'text-rose-600' },
                { label: 'Net Savings', value: formatCurrency(summary?.netSavings ?? 0, currency), icon: '💙', color: 'text-blue-600' },
                { label: 'Savings Rate', value: formatPercentage(summary?.savingsRate ?? 0), icon: '💜', color: 'text-purple-600' },
              ].map(({ label, value, icon, color }) => (
                <Card key={label}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className={`font-heading font-bold text-xl tabular ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                </Card>
              ))}
            </div>
          )}

          {/* MoM change */}
          {!summaryLoading && summary && (
            <Card>
              <CardHeader>
                <CardTitle>Month-over-Month Change</CardTitle>
              </CardHeader>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-heading font-bold tabular ${getDeltaColor(-(summary.monthOverMonthChange))}`}>
                  {formatDelta(-(summary.monthOverMonthChange))}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  vs previous period expenses ({formatCurrency(summary.previousMonthExpenses, currency)})
                </div>
              </div>
            </Card>
          )}

          {/* Top categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
              <span className="text-xs text-slate-400">{RANGE_OPTIONS.find((r) => r.value === range)?.label}</span>
            </CardHeader>
            {catsLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No expense data for this period</p>
            ) : (
              <div className="space-y-3">
                {categories.slice(0, 8).map((cat, i) => (
                  <div key={String(cat.categoryId)} className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-lg flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                        <span className="text-sm tabular font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(cat.total, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${cat.percentage}%`, background: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right flex-shrink-0">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {(['3m', '6m', '12m'] as TrendPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setTrendPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${trendPeriod === p ? 'bg-primary text-white' : 'btn-secondary'}`}
              >
                {p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : '12 Months'}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            {trendsLoading
              ? <Skeleton className="h-72" />
              : <TrendLineChart data={trends} currency={currency} height={300} />}
          </Card>

          {/* Monthly breakdown table */}
          {!trendsLoading && trends.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wider">Month</th>
                      <th className="text-right py-2 px-3 text-xs text-emerald-600 uppercase tracking-wider">Income</th>
                      <th className="text-right py-2 px-3 text-xs text-rose-600 uppercase tracking-wider">Expenses</th>
                      <th className="text-right py-2 px-3 text-xs text-blue-600 uppercase tracking-wider">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...trends].reverse().map((t) => (
                      <tr key={t.month} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{t.month}</td>
                        <td className="py-2.5 px-3 text-right tabular text-emerald-600 dark:text-emerald-400">{formatCurrency(t.income, currency)}</td>
                        <td className="py-2.5 px-3 text-right tabular text-rose-600 dark:text-rose-400">{formatCurrency(t.expenses, currency)}</td>
                        <td className={`py-2.5 px-3 text-right tabular font-semibold ${t.netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(t.netSavings, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {RANGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${range === value ? 'bg-primary text-white' : 'btn-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending Breakdown</CardTitle>
                <span className="text-xs text-slate-400">{formatCurrency(catTotal, currency)} total</span>
              </CardHeader>
              {catsLoading ? <Skeleton className="h-64" /> : <SpendingPieChart data={categories} currency={currency} donut height={280} />}
            </Card>

            <Card>
              <CardHeader><CardTitle>Category Details</CardTitle></CardHeader>
              {catsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : (
                <div className="overflow-y-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white dark:bg-slate-800">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-slate-500">Category</th>
                        <th className="text-right py-2 text-slate-500">Total</th>
                        <th className="text-right py-2 text-slate-500">%</th>
                        <th className="text-right py-2 text-slate-500">Avg/mo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={String(cat.categoryId)} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2">
                            <span className="flex items-center gap-1.5">
                              <span>{cat.icon}</span> {cat.category}
                            </span>
                          </td>
                          <td className="py-2 text-right tabular font-medium">{formatCurrency(cat.total, currency)}</td>
                          <td className="py-2 text-right tabular text-slate-400">{cat.percentage.toFixed(1)}%</td>
                          <td className="py-2 text-right tabular text-slate-400">{formatCurrency(cat.avgPerMonth, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHeatmapYear((y) => y - 1)}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              ←
            </button>
            <span className="font-heading font-semibold text-slate-900 dark:text-slate-100 text-lg w-16 text-center">
              {heatmapYear}
            </span>
            <button
              onClick={() => setHeatmapYear((y) => Math.min(y + 1, new Date().getFullYear()))}
              className="btn-secondary text-sm px-3 py-1.5"
              disabled={heatmapYear >= new Date().getFullYear()}
            >
              →
            </button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Spending — {heatmapYear}</CardTitle>
            </CardHeader>
            {heatmapLoading
              ? <Skeleton className="h-40 w-full" />
              : <HeatmapCalendar data={heatmapData} maxTotal={maxTotal} year={heatmapYear} currency={currency} />}
          </Card>
        </div>
      )}
    </div>
  )
}
