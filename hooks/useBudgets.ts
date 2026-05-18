'use client'

import { useState, useEffect, useCallback } from 'react'
import type { IBudget } from '@/types'

interface BudgetWithSpent extends IBudget {
  spentAmount: number
  remainingAmount: number
  percentageUsed: number
}

interface UseBudgetsResult {
  budgets: BudgetWithSpent[]
  alerts: BudgetWithSpent[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useBudgets(): UseBudgetsResult {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [alerts, setAlerts] = useState<BudgetWithSpent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), [])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetch('/api/budgets').then((r) => r.json()),
      fetch('/api/budgets/alerts').then((r) => r.json()),
    ])
      .then(([b, a]) => {
        setBudgets(b.data ?? [])
        setAlerts(a.data ?? [])
        setError(null)
      })
      .catch(() => setError('Failed to load budgets'))
      .finally(() => setIsLoading(false))
  }, [fetchTrigger])

  return { budgets, alerts, isLoading, error, refetch }
}
