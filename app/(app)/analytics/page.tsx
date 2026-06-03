'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSummary, useTrends, useCategoryBreakdown, useHeatmap } from '@/hooks/useAnalytics'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import { RangeSelector } from '@/components/ui/RangeSelector'
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    )},
    { id: 'trends', label: 'Trends', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
    )},
    { id: 'categories', label: 'Categories', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
      </svg>
    )},
    { id: 'heatmap', label: 'Heatmap', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    )},
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
            {icon}
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <RangeSelector options={RANGE_OPTIONS} value={range} onChange={setRange} />

          {summaryLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Income',
                  value: formatCurrency(summary?.totalIncome ?? 0, currency),
                  color: 'text-emerald-700 dark:text-emerald-300',
                  iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" /></svg>,
                },
                {
                  label: 'Total Expenses',
                  value: formatCurrency(summary?.totalExpenses ?? 0, currency),
                  color: 'text-rose-700 dark:text-rose-300',
                  iconBg: 'bg-rose-100 dark:bg-rose-900/50',
                  iconColor: 'text-rose-600 dark:text-rose-400',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" /></svg>,
                },
                {
                  label: 'Net Savings',
                  value: formatCurrency(summary?.netSavings ?? 0, currency),
                  color: (summary?.netSavings ?? 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300',
                  iconBg: 'bg-blue-100 dark:bg-blue-900/50',
                  iconColor: 'text-blue-600 dark:text-blue-400',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>,
                },
                {
                  label: 'Savings Rate',
                  value: formatPercentage(summary?.savingsRate ?? 0),
                  color: 'text-purple-700 dark:text-purple-300',
                  iconBg: 'bg-purple-100 dark:bg-purple-900/50',
                  iconColor: 'text-purple-600 dark:text-purple-400',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
                },
              ].map(({ label, value, icon, color, iconBg, iconColor }) => (
                <Card key={label} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <span className={iconColor}>{icon}</span>
                  </div>
                  <div>
                    <p className={`font-heading font-bold text-xl tabular ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                  </div>
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
          <RangeSelector options={RANGE_OPTIONS} value={range} onChange={setRange} />

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
