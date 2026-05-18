'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSummary, useTrends, useCategoryBreakdown, useHeatmap } from '@/hooks/useAnalytics'
import { useBudgets } from '@/hooks/useBudgets'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import {
  formatCurrency, formatDelta, getDeltaColor,
  getProgressColor, formatPercentage, formatDate,
} from '@/lib/formatters'
import type { ITransaction } from '@/types'

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
        <div className="space-y-3">
          {transactions.map((t) => {
            const cat = t.categoryId as unknown as { icon?: string }
            return (
              <div key={String(t.id)} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                  {cat?.icon ?? '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`text-sm font-semibold tabular flex-shrink-0 ${
                    t.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const year = new Date().getFullYear()

  const { summary, isLoading: summaryLoading } = useSummary()
  const { trends, isLoading: trendsLoading } = useTrends('6m')
  const { categories, isLoading: catsLoading } = useCategoryBreakdown()
  const { data: heatmapData, maxTotal, isLoading: heatmapLoading } = useHeatmap(year)
  const { budgets, isLoading: budgetsLoading } = useBudgets()

  const topBudgets = budgets.slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100">
          Good day, {session?.user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Here&apos;s your financial overview for this month.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Card>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">💚</span>
                <Badge variant="income">Income</Badge>
              </div>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.totalIncome ?? 0, currency)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This month</p>
            </Card>

            <Card>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">❤️</span>
                <Badge variant="expense">Expenses</Badge>
              </div>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.totalExpenses ?? 0, currency)}
              </p>
              <p className={`text-xs mt-1 ${getDeltaColor(-(summary?.monthOverMonthChange ?? 0))}`}>
                {formatDelta(-(summary?.monthOverMonthChange ?? 0))} vs last month
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">💙</span>
                <Badge variant={(summary?.netSavings ?? 0) >= 0 ? 'success' : 'danger'}>Savings</Badge>
              </div>
              <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                {formatCurrency(summary?.netSavings ?? 0, currency)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Net this month</p>
            </Card>

            <Card>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100 tabular animate-value">
                    {formatPercentage(summary?.savingsRate ?? 0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Savings rate</p>
                </div>
                <SavingsRing rate={summary?.savingsRate ?? 0} />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Trend chart — full width */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <span className="text-xs text-slate-400">Last 6 months</span>
        </CardHeader>
        {trendsLoading ? <Skeleton className="h-72" /> : <TrendLineChart data={trends} currency={currency} height={300} />}
      </Card>

      {/* Bottom grid: Spending | Budget Health | Recent Transactions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <span className="text-xs text-slate-400">This month</span>
          </CardHeader>
          {catsLoading
            ? <Skeleton className="h-60" />
            : <SpendingPieChart data={categories} currency={currency} />}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Health</CardTitle>
            <Link href="/budgets" className="text-xs text-primary dark:text-primary-300 hover:underline">
              View all
            </Link>
          </CardHeader>
          {budgetsLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : topBudgets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No budgets set up yet</p>
          ) : (
            <div className="space-y-4">
              {topBudgets.map((b) => {
                const pct = b.percentageUsed ?? 0
                const cat = b.category as unknown as { icon?: string }
                return (
                  <div key={String(b.id)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {cat?.icon ?? '💰'} {b.name}
                      </span>
                      <span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>
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

        <RecentTransactions currency={currency} />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Heatmap</CardTitle>
          <span className="text-xs text-slate-400">{year}</span>
        </CardHeader>
        {heatmapLoading
          ? <Skeleton className="h-36 w-full" />
          : <HeatmapCalendar data={heatmapData} maxTotal={maxTotal} year={year} currency={currency} />}
      </Card>
    </div>
  )
}
