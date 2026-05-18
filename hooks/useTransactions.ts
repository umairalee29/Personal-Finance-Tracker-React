'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import type { ITransaction, IPaginatedResponse } from '@/types'

interface UseTransactionsResult {
  transactions: ITransaction[]
  total: number
  totalPages: number
  isLoading: boolean
  error: string | null
  summary: { totalIncome: number; totalExpenses: number }
  refetch: () => void
}

export function useTransactions(): UseTransactionsResult {
  const { filters } = useStore()
  const [data, setData] = useState<IPaginatedResponse<ITransaction> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(filters.page))
    params.set('limit', String(filters.limit))
    if (filters.type) params.set('type', filters.type)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortDir) params.set('sortDir', filters.sortDir)

    setIsLoading(true)
    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json)
        setError(null)
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setIsLoading(false))
  }, [filters, fetchTrigger])

  return {
    transactions: (data?.data ?? []) as ITransaction[],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    summary: data?.summary ?? { totalIncome: 0, totalExpenses: 0 },
    refetch,
  }
}
