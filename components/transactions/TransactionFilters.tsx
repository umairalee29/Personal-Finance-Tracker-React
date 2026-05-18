'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import type { ICategory, TransactionType, TransactionStatus } from '@/types'

export function TransactionFilters() {
  const { filters, setFilters, resetFilters } = useStore()
  const [categories, setCategories] = useState<ICategory[]>([])
  const [search, setSearch] = useState(filters.search ?? '')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: search || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, setFilters])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="input"
          />
        </div>

        {/* Type */}
        <div>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {([undefined, 'income', 'expense', 'transfer'] as (TransactionType | undefined)[]).map((t) => (
              <button
                key={t ?? 'all'}
                onClick={() => setFilters({ type: t, page: 1 })}
                className={`px-3 py-2 text-xs font-medium transition-colors
                  ${filters.type === t
                    ? 'bg-primary text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <select
          value={filters.categoryId ?? ''}
          onChange={(e) => setFilters({ categoryId: e.target.value || undefined, page: 1 })}
          className="select w-40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={String((c as unknown as { _id: string })._id)} value={String((c as unknown as { _id: string })._id)}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ status: (e.target.value || undefined) as TransactionStatus | undefined, page: 1 })}
          className="select w-36"
        >
          <option value="">All statuses</option>
          <option value="cleared">Cleared</option>
          <option value="pending">Pending</option>
          <option value="reconciled">Reconciled</option>
        </select>

        {/* Date range */}
        <input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => setFilters({ startDate: e.target.value || undefined, page: 1 })}
          className="input w-36"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => setFilters({ endDate: e.target.value || undefined, page: 1 })}
          className="input w-36"
          placeholder="To"
        />

        {/* Reset */}
        <button onClick={() => { resetFilters(); setSearch('') }} className="btn-ghost text-xs">
          Reset
        </button>
      </div>
    </div>
  )
}
