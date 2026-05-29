'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { DATE_PRESETS, getPresetDates, getActiveDateLabel } from '@/lib/datePresets'
import type { ICategory, TransactionType, TransactionStatus } from '@/types'

export function TransactionFilters() {
  const { filters, setFilters, resetFilters } = useStore()
  const [categories, setCategories] = useState<ICategory[]>([])
  const [search, setSearch] = useState(filters.search ?? '')
  const [tagInput, setTagInput] = useState('')
  const [showDateMenu, setShowDateMenu] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    const existing = filters.tags ?? []
    if (existing.includes(tag)) { setTagInput(''); return }
    setFilters({ tags: [...existing, tag], page: 1 })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    const updated = (filters.tags ?? []).filter((t) => t !== tag)
    setFilters({ tags: updated.length ? updated : undefined, page: 1 })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && (filters.tags?.length ?? 0) > 0) {
      removeTag(filters.tags![filters.tags!.length - 1])
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDateMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeDateLabel = getActiveDateLabel(filters.startDate, filters.endDate)
  const hasCustomDates = !!(filters.startDate || filters.endDate)

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
    filters.status || filters.startDate || filters.endDate ||
    filters.tags?.length
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
          <div className="flex h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {([undefined, 'income', 'expense', 'transfer'] as (TransactionType | undefined)[]).map((t) => (
              <button
                key={t ?? 'all'}
                onClick={() => setFilters({ type: t, page: 1 })}
                className={`h-full px-3 text-xs font-medium transition-colors
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
            className="select h-[38px] w-44"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={String(c._id)} value={String(c._id)}>
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
          <div className="flex h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {([
              { value: undefined,      label: 'All' },
              { value: 'cleared',      label: 'Cleared' },
              { value: 'pending',      label: 'Pending' },
              { value: 'reconciled',   label: 'Reconciled' },
            ] as { value: TransactionStatus | undefined; label: string }[]).map(({ value, label }) => {
              const active = filters.status === value
              const activeStyle = !value
                ? 'bg-primary text-white'
                : value === 'cleared'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : value === 'pending'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
              return (
                <button
                  key={value ?? 'all'}
                  onClick={() => setFilters({ status: value, page: 1 })}
                  className={`h-full px-3 text-xs font-medium transition-colors border-r border-slate-200 dark:border-slate-700 last:border-r-0
                    ${active
                      ? activeStyle
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="flex-1 min-w-44">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Tags
          </label>
          <div
            className="flex flex-wrap items-center gap-1 px-2 py-1 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-colors cursor-text"
            onClick={() => tagInputRef.current?.focus()}
          >
            {(filters.tags ?? []).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 bg-primary/10 text-primary dark:text-primary-300 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {tag}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                  className="hover:opacity-60 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
              placeholder={(filters.tags?.length ?? 0) > 0 ? '' : 'Add tag…'}
              className="flex-1 min-w-16 bg-transparent outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Date range */}
        <div className="relative" ref={dateRef}>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            Date range
          </label>
          <button
            onClick={() => setShowDateMenu((v) => !v)}
            className={`h-[38px] flex items-center gap-2 px-3 rounded-lg border text-xs font-medium transition-colors w-44
              ${hasCustomDates || showDateMenu
                ? 'border-primary/50 bg-primary/5 text-primary dark:text-primary-300 dark:border-primary/40 dark:bg-primary/10'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 text-left truncate">{activeDateLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${showDateMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showDateMenu && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 py-1.5 overflow-hidden">
              {DATE_PRESETS.map((p) => {
                const { startDate: ps, endDate: pe } = getPresetDates(p.value)
                const isActive = ps === filters.startDate && pe === filters.endDate
                return (
                  <button
                    key={p.value}
                    onClick={() => {
                      setFilters({ ...getPresetDates(p.value), page: 1 })
                      setShowDateMenu(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors
                      ${isActive
                        ? 'bg-primary/10 text-primary dark:text-primary-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                  >
                    {p.label}
                    {isActive && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}

              {/* Custom range */}
              <div className="border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-1.5 px-3 pb-2 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Custom range
                </p>
                <div className="space-y-1.5">
                  <input
                    type="date"
                    value={filters.startDate ?? ''}
                    onChange={(e) => setFilters({ startDate: e.target.value || undefined, page: 1 })}
                    className="input text-xs py-1.5 w-full"
                  />
                  <input
                    type="date"
                    value={filters.endDate ?? ''}
                    onChange={(e) => setFilters({ endDate: e.target.value || undefined, page: 1 })}
                    className="input text-xs py-1.5 w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="ml-auto">
          <button
            onClick={() => { resetFilters(); setSearch(''); setTagInput('') }}
            disabled={!hasActiveFilters}
            className={`h-[38px] flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors
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
