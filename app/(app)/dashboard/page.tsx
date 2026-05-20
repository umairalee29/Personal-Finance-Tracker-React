'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useDashboard } from '@/hooks/useDashboard'
import { useFilteredFetch } from '@/hooks/useFilteredFetch'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import {
  formatCurrency, formatDelta, getDeltaColor,
  getProgressColor, formatPercentage, formatDate, formatRelativeDate,
} from '@/lib/formatters'
import type { ITransaction, IMonthlyTrend, ICategoryBreakdown, IHeatmapDay } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const HEATMAP_YEARS = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR]

const CAT_FILTERS = [
  { label: 'This Month', value: 'this-month' },
  { label: '3 Months',   value: '3m' },
  { label: '6 Months',   value: '6m' },
  { label: 'This Year',  value: 'this-year' },
] as const

const TREND_FILTERS = [
  { label: 'Daily',    value: 'daily' },
  { label: 'Weekly',   value: 'weekly' },
  { label: 'Monthly',  value: 'monthly' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year',   value: '1y' },
] as const

type CatPeriod       = typeof CAT_FILTERS[number]['value']
type TrendGranularity = typeof TREND_FILTERS[number]['value']
type HeatmapResult   = { data: IHeatmapDay[]; maxTotal: number }

// ─── Module-level fetchers (stable references — no useCallback needed) ────────

function getCatDateRange(period: CatPeriod) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString()
  if (period === '3m')        return { startDate: new Date(y, m - 2, 1).toISOString(), endDate: end }
  if (period === '6m')        return { startDate: new Date(y, m - 5, 1).toISOString(), endDate: end }
  if (period === 'this-year') return { startDate: new Date(y, 0, 1).toISOString(), endDate: new Date(y, 11, 31, 23, 59, 59).toISOString() }
  return { startDate: new Date(y, m, 1).toISOString(), endDate: end }
}

async function fetchTrends(granularity: TrendGranularity): Promise<IMonthlyTrend[]> {
  const res = await fetch(`/api/analytics/trends?granularity=${granularity}`)
  const json = await res.json()
  return json.data ?? []
}

async function fetchCategories(period: CatPeriod): Promise<ICategoryBreakdown[]> {
  const { startDate, endDate } = getCatDateRange(period)
  const res = await fetch(`/api/analytics/categories?startDate=${startDate}&endDate=${endDate}`)
  const json = await res.json()
  return json.data ?? []
}

async function fetchHeatmap(year: number): Promise<HeatmapResult> {
  const res = await fetch(`/api/analytics/heatmap?year=${year}`)
  const json = await res.json()
  return { data: json.data ?? [], maxTotal: json.maxTotal ?? 1 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeatmapCard({ initialData, initialMaxTotal, isInitialLoading, currency }: {
  initialData: IHeatmapDay[]
  initialMaxTotal: number
  isInitialLoading: boolean
  currency: string
}) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)

  const { data: result, loading } = useFilteredFetch<HeatmapResult, number>({
    defaultValue: CURRENT_YEAR,
    filter: selectedYear,
    initialData: { data: initialData, maxTotal: initialMaxTotal },
    isInitialLoading,
    fetcher: fetchHeatmap,
  })

  const { data, maxTotal } = result

  const activeDays = data.filter((d) => d.total > 0).length
  const busiestDay = data.reduce(
    (max, d) => (d.total > max.total ? d : max),
    data[0] ?? { date: '', total: 0, count: 0 }
  )
  const monthTotals: Record<string, number> = {}
  data.forEach((d) => { const m = d.date.slice(0, 7); monthTotals[m] = (monthTotals[m] ?? 0) + d.total })
  const peakEntry = Object.entries(monthTotals).sort(([, a], [, b]) => b - a)[0]
  const peakMonthLabel = peakEntry ? new Date(peakEntry[0] + '-01').toLocaleString('default', { month: 'long' }) : '—'
  const peakMonthAmount = peakEntry ? peakEntry[1] : 0
  const isLeap = new Date(selectedYear, 1, 29).getMonth() === 1

  const stats = [
    {
      icon: '🔥',
      label: 'Busiest day',
      value: busiestDay.date ? formatDate(busiestDay.date, 'MMM d') : '—',
      sub: busiestDay.total > 0 ? formatCurrency(busiestDay.total, currency) : 'No data',
    },
    {
      icon: '📅',
      label: 'Active days',
      value: String(activeDays),
      sub: `of ${isLeap ? 366 : 365} days`,
    },
    {
      icon: '📈',
      label: 'Peak month',
      value: peakMonthLabel,
      sub: peakMonthAmount > 0 ? formatCurrency(peakMonthAmount, currency) : 'No data',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Heatmap</CardTitle>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl p-1">
          {HEATMAP_YEARS.map((y) => {
            const active = y === selectedYear
            return (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`relative px-3.5 py-1 rounded-lg text-xs font-semibold
                            cursor-pointer transition-all duration-200 select-none
                            ${active
                              ? 'bg-primary text-white shadow-md shadow-primary/25'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-600/50'
                            }`}
              >
                {y}
              </button>
            )
          })}
        </div>
      </CardHeader>

      {loading ? (
        <Skeleton className="h-36 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                           bg-slate-50 dark:bg-slate-700/40
                           border border-slate-200 dark:border-slate-700"
              >
                <span className="text-lg">{s.icon}</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {s.value}
                    <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                      {s.sub}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <HeatmapCalendar data={data} maxTotal={maxTotal} year={selectedYear} currency={currency} />
        </>
      )}
    </Card>
  )
}

function CategoryCard({ initialCategories, isInitialLoading, currency }: {
  initialCategories: ICategoryBreakdown[]
  isInitialLoading: boolean
  currency: string
}) {
  const [period, setPeriod] = useState<CatPeriod>('this-month')

  const { data, loading } = useFilteredFetch<ICategoryBreakdown[], CatPeriod>({
    defaultValue: 'this-month',
    filter: period,
    initialData: initialCategories,
    isInitialLoading,
    fetcher: fetchCategories,
  })

  return (
    <Card>
      <CardHeader className="mb-2">
        <CardTitle>Spending by Category</CardTitle>
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
          {CAT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPeriod(f.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                period === f.value
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      {loading
        ? <Skeleton className="h-60" />
        : <div className="mt-8"><SpendingPieChart data={data} currency={currency} /></div>}
    </Card>
  )
}

function TrendCard({ initialTrends, isInitialLoading, currency }: {
  initialTrends: IMonthlyTrend[]
  isInitialLoading: boolean
  currency: string
}) {
  const [granularity, setGranularity] = useState<TrendGranularity>('6m')

  const { data, loading } = useFilteredFetch<IMonthlyTrend[], TrendGranularity>({
    defaultValue: '6m',
    filter: granularity,
    initialData: initialTrends,
    isInitialLoading,
    fetcher: fetchTrends,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
          {TREND_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setGranularity(f.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                granularity === f.value
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      {loading ? <Skeleton className="h-72" /> : <TrendLineChart data={data} currency={currency} height={300} />}
    </Card>
  )
}

function SavingsRing({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate))
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
        className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#6366f1" strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text
        x="36" y="40"
        textAnchor="middle"
        fill="currentColor"
        className="text-slate-900 dark:text-slate-100"
        style={{ fontSize: '11px', transform: 'rotate(90deg)', transformOrigin: '36px 36px', fontVariantNumeric: 'tabular-nums' }}
      >
        {pct.toFixed(0)}%
      </text>
    </svg>
  )
}

function RecentTransactions({ currency }: { currency: string }) {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions?limit=5&sortBy=date&sortDir=desc')
      .then((r) => r.json())
      .then((j) => setTransactions(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const groups: { label: string; items: ITransaction[] }[] = []
  const seen = new Map<string, number>()
  for (const t of transactions) {
    const key = formatDate(t.date, 'yyyy-MM-dd')
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ label: formatRelativeDate(t.date), items: [] })
    }
    groups[seen.get(key)!].items.push(t)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <Link href="/transactions" className="text-xs text-primary dark:text-primary-300 hover:underline">
          View all
        </Link>
      </CardHeader>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No transactions yet</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((t) => {
                  const cat = t.categoryId as unknown as { icon?: string; name?: string }
                  const isIncome = t.type === 'income'
                  return (
                    <div
                      key={String(t.id)}
                      className={`flex items-center gap-3 pl-3 border-l-2 ${
                        isIncome ? 'border-l-emerald-500' : 'border-l-rose-500'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base flex-shrink-0">
                        {cat?.icon ?? '💰'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {t.description}
                        </p>
                        {cat?.name && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {cat.name}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIncome ? '+' : '−'}{formatCurrency(t.amount, currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'

  const {
    summary,
    trends,
    categories,
    heatmap: heatmapData,
    maxTotal,
    budgets,
    alerts,
    isLoading,
  } = useDashboard()

  const topBudgets = budgets.slice(0, 4)

  const insight = (() => {
    if (!summary) return null
    const mom = summary.monthOverMonthChange ?? 0
    const alertCount = alerts.length
    const expenseText = mom === 0
      ? 'Expenses are on par with last month'
      : mom > 0
      ? `Expenses are up ${Math.abs(mom).toFixed(0)}% vs last month`
      : `Expenses are down ${Math.abs(mom).toFixed(0)}% vs last month`
    const budgetText = alertCount === 0
      ? 'all budgets are on track'
      : alertCount === 1 ? '1 budget needs attention' : `${alertCount} budgets need attention`
    const tone: 'green' | 'amber' | 'red' = (mom > 15 && alertCount > 0) ? 'red' : (mom > 5 || alertCount > 0) ? 'amber' : 'green'
    const separator = alertCount === 0 && mom <= 0 ? ' and ' : ' — '
    return { message: `${expenseText}${separator}${budgetText}.`, tone }
  })()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100">
          {getGreeting()}, {session?.user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Here&apos;s your financial overview for this month.
        </p>
      </div>

      {/* Insight strip */}
      {!isLoading && insight && (() => {
        const styles: Record<'green' | 'amber' | 'red', string> = {
          green: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
          amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
          red:   'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
        }
        const icons: Record<'green' | 'amber' | 'red', string> = { green: '✅', amber: '⚠️', red: '🚨' }
        return (
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium ${styles[insight.tone]}`}>
            <span className="text-base flex-shrink-0">{icons[insight.tone]}</span>
            <span>{insight.message}</span>
          </div>
        )
      })()}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wide">
                Income
              </p>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.totalIncome ?? 0, currency)}
              </p>
              <p className={`text-xs mt-1 font-medium ${getDeltaColor(summary?.incomeMonthOverMonthChange ?? 0)}`}>
                {formatDelta(summary?.incomeMonthOverMonthChange ?? 0)} vs last month
              </p>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-3 uppercase tracking-wide">
                Expenses
              </p>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.totalExpenses ?? 0, currency)}
              </p>
              <p className={`text-xs mt-1 font-medium ${getDeltaColor(-(summary?.monthOverMonthChange ?? 0))}`}>
                {formatDelta(-(summary?.monthOverMonthChange ?? 0))} vs last month
              </p>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                Net Savings
              </p>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.netSavings ?? 0, currency)}
              </p>
              <p className={`text-xs mt-1 font-medium ${(summary?.netSavings ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {(summary?.netSavings ?? 0) >= 0 ? '↑ Positive' : '↓ Negative'} this month
              </p>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <p className="text-xs font-semibold text-primary dark:text-primary-300 mb-3 uppercase tracking-wide">
                Savings Rate
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                  {formatPercentage(summary?.savingsRate ?? 0)}
                </p>
                <SavingsRing rate={summary?.savingsRate ?? 0} />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Trend chart — full width */}
      <TrendCard initialTrends={trends} isInitialLoading={isLoading} currency={currency} />

      {/* Bottom grid: Spending | Budget Health (top row) + Recent Transactions (full width) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CategoryCard initialCategories={categories} isInitialLoading={isLoading} currency={currency} />

        <Card>
          <CardHeader>
            <CardTitle>Budget Health</CardTitle>
            <Link href="/budgets" className="text-xs text-primary dark:text-primary-300 hover:underline">
              View all
            </Link>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : topBudgets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No budgets set up yet</p>
          ) : (
            <div className="space-y-4">
              {topBudgets.map((b) => {
                const pct = b.percentageUsed ?? 0
                const cat = b.category as unknown as { icon?: string }
                const isOver = pct >= (b.alertThreshold ?? 80)
                const isCritical = pct >= 100
                const alertRing = isCritical
                  ? 'ring-1 ring-rose-400 dark:ring-rose-500 bg-rose-50/60 dark:bg-rose-950/20'
                  : isOver
                  ? 'ring-1 ring-amber-400 dark:ring-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
                  : ''
                return (
                  <div key={String(b.id)} className={`rounded-lg px-3 py-2.5 -mx-3 transition-all duration-300 ${alertRing}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {cat?.icon ?? '💰'} {b.name}
                        {isOver && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCritical ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                            {isCritical ? 'Over' : 'Alert'}
                          </span>
                        )}
                      </span>
                      <span className={`text-xs font-semibold ${isCritical ? 'text-rose-600 dark:text-rose-400' : isOver ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`progress-bar ${getProgressColor(pct)}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">{formatCurrency(b.spentAmount ?? 0, currency)}</span>
                      <span className="text-xs text-slate-400">/{formatCurrency(b.limit, currency)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions — full width */}
      <RecentTransactions currency={currency} />

      {/* Heatmap */}
      <HeatmapCard
        initialData={heatmapData}
        initialMaxTotal={maxTotal}
        isInitialLoading={isLoading}
        currency={currency}
      />
    </div>
  )
}
