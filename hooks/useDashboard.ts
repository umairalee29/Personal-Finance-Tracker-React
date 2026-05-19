'use client'

import useSWR from 'swr'
import type { IAnalyticsSummary, IMonthlyTrend, ICategoryBreakdown, IHeatmapDay, IBudget } from '@/types'

interface BudgetWithSpent extends IBudget {
  spentAmount: number
  remainingAmount: number
  percentageUsed: number
}

interface DashboardData {
  summary: IAnalyticsSummary
  trends: IMonthlyTrend[]
  categories: ICategoryBreakdown[]
  heatmap: IHeatmapDay[]
  maxTotal: number
  budgets: BudgetWithSpent[]
  alerts: BudgetWithSpent[]
}

interface UseDashboardResult {
  summary: IAnalyticsSummary | null
  trends: IMonthlyTrend[]
  categories: ICategoryBreakdown[]
  heatmap: IHeatmapDay[]
  maxTotal: number
  budgets: BudgetWithSpent[]
  alerts: BudgetWithSpent[]
  isLoading: boolean
  error: unknown
  mutate: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDashboard(): UseDashboardResult {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: false }
  )

  return {
    summary: data?.summary ?? null,
    trends: data?.trends ?? [],
    categories: data?.categories ?? [],
    heatmap: data?.heatmap ?? [],
    maxTotal: data?.maxTotal ?? 1,
    budgets: data?.budgets ?? [],
    alerts: data?.alerts ?? [],
    isLoading,
    error,
    mutate,
  }
}
