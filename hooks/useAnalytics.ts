'use client'

import { useState, useEffect } from 'react'
import type { IAnalyticsSummary, IMonthlyTrend, ICategoryBreakdown, IHeatmapDay } from '@/types'

interface UseSummaryResult {
  summary: IAnalyticsSummary | null
  isLoading: boolean
}

export function useSummary(startDate?: string, endDate?: string): UseSummaryResult {
  const [summary, setSummary] = useState<IAnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    setIsLoading(true)
    fetch(`/api/analytics/summary?${params}`)
      .then((r) => r.json())
      .then((j) => setSummary(j.data))
      .finally(() => setIsLoading(false))
  }, [startDate, endDate])

  return { summary, isLoading }
}

interface UseTrendsResult {
  trends: IMonthlyTrend[]
  isLoading: boolean
}

export function useTrends(period: '3m' | '6m' | '12m' = '6m'): UseTrendsResult {
  const [trends, setTrends] = useState<IMonthlyTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/analytics/trends?period=${period}`)
      .then((r) => r.json())
      .then((j) => setTrends(j.data ?? []))
      .finally(() => setIsLoading(false))
  }, [period])

  return { trends, isLoading }
}

interface UseCategoryBreakdownResult {
  categories: ICategoryBreakdown[]
  total: number
  isLoading: boolean
}

export function useCategoryBreakdown(
  startDate?: string,
  endDate?: string,
  type: 'income' | 'expense' = 'expense'
): UseCategoryBreakdownResult {
  const [categories, setCategories] = useState<ICategoryBreakdown[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ type })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    setIsLoading(true)
    fetch(`/api/analytics/categories?${params}`)
      .then((r) => r.json())
      .then((j) => { setCategories(j.data ?? []); setTotal(j.total ?? 0) })
      .finally(() => setIsLoading(false))
  }, [startDate, endDate, type])

  return { categories, total, isLoading }
}

interface UseHeatmapResult {
  data: IHeatmapDay[]
  maxTotal: number
  isLoading: boolean
}

export function useHeatmap(year: number): UseHeatmapResult {
  const [data, setData] = useState<IHeatmapDay[]>([])
  const [maxTotal, setMaxTotal] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/analytics/heatmap?year=${year}`)
      .then((r) => r.json())
      .then((j) => { setData(j.data ?? []); setMaxTotal(j.maxTotal ?? 1) })
      .finally(() => setIsLoading(false))
  }, [year])

  return { data, maxTotal, isLoading }
}
