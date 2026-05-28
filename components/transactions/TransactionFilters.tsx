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

  const hasActiveFilters = !!(
    filters.search || filters.type || filters.categoryId ||
    filters.status || filters.startDate || filters.endDate
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
      {/* Row 1: Search + Type */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-52">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Search
          </label>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description…"
              className="input pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Type
          </label>
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
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-700/60" />

      {/* Row 2: Category + Status + Date range + Reset */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Category
          </label>
          <select
            value={filters.categoryId ?? ''}
            onChange={(e) => setFilters({ categoryId: e.target.value || undefined, page: 1 })}
            className="select w-44"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={String((c as unknown as { _id: string })._id)} value={String((c as unknown as { _id: string })._id)}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Status
          </label>
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
        </div>

        {/* Date range */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Date range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={(e) => setFilters({ startDate: e.target.value || undefined, page: 1 })}
              className="input w-36"
            />
            <span className="text-slate-400 dark:text-slate-500 text-sm select-none">→</span>
            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={(e) => setFilters({ endDate: e.target.value || undefined, page: 1 })}
              className="input w-36"
            />
          </div>
        </div>

        {/* Reset */}
        <div className="ml-auto">
          <button
            onClick={() => { resetFilters(); setSearch('') }}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${hasActiveFilters
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear filters
          </button>
        </div>
      </div>
    </div>
  )
}
