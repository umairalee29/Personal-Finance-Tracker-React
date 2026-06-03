'use client'

import { useState, useEffect, useCallback } from 'react'
import type { IAnalyticsSummary, IMonthlyTrend, ICategoryBreakdown, IHeatmapDay } from '@/types'

interface UseSummaryResult {
  summary: IAnalyticsSummary | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useSummary(startDate?: string, endDate?: string): UseSummaryResult {
  const [summary, setSummary] = useState<IAnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    setIsLoading(true)
    fetch(`/api/analytics/summary?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error)
        setSummary(j.data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message ?? 'Failed to load summary'))
      .finally(() => setIsLoading(false))
  }, [startDate, endDate, fetchTrigger])

  return { summary, isLoading, error, refetch }
}

interface UseTrendsResult {
  trends: IMonthlyTrend[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useTrends(period: '3m' | '6m' | '12m' = '6m'): UseTrendsResult {
  const [trends, setTrends] = useState<IMonthlyTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/analytics/trends?period=${period}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error)
        setTrends(j.data ?? [])
        setError(null)
      })
      .catch((e: Error) => setError(e.message ?? 'Failed to load trends'))
      .finally(() => setIsLoading(false))
  }, [period, fetchTrigger])

  return { trends, isLoading, error, refetch }
}

interface UseCategoryBreakdownResult {
  categories: ICategoryBreakdown[]
  total: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategoryBreakdown(
  startDate?: string,
  endDate?: string,
  type: 'income' | 'expense' = 'expense'
): UseCategoryBreakdownResult {
  const [categories, setCategories] = useState<ICategoryBreakdown[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    const params = new URLSearchParams({ type })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    setIsLoading(true)
    fetch(`/api/analytics/categories?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error)
        setCategories(j.data ?? [])
        setTotal(j.total ?? 0)
        setError(null)
      })
      .catch((e: Error) => setError(e.message ?? 'Failed to load categories'))
      .finally(() => setIsLoading(false))
  }, [startDate, endDate, type, fetchTrigger])

  return { categories, total, isLoading, error, refetch }
}

interface UseHeatmapResult {
  data: IHeatmapDay[]
  maxTotal: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useHeatmap(year: number): UseHeatmapResult {
  const [data, setData] = useState<IHeatmapDay[]>([])
  const [maxTotal, setMaxTotal] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/analytics/heatmap?year=${year}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error)
        setData(j.data ?? [])
        setMaxTotal(j.maxTotal ?? 1)
        setError(null)
      })
      .catch((e: Error) => setError(e.message ?? 'Failed to load heatmap'))
      .finally(() => setIsLoading(false))
  }, [year, fetchTrigger])

  return { data, maxTotal, isLoading, error, refetch }
}
