'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTransactions } from '@/hooks/useTransactions'
import { useStore } from '@/store'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { ImportCSVModal } from '@/components/transactions/ImportCSVModal'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { formatCurrency } from '@/lib/formatters'

export default function TransactionsPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const { filters, setFilters } = useStore()
  const { transactions, total, totalPages, isLoading, summary, refetch } = useTransactions()
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const net = summary.totalIncome - summary.totalExpenses

  const handleExport = () => {
    const params = new URLSearchParams()
    params.set('export', 'true')
    if (filters.type) params.set('type', filters.type)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.search) params.set('search', filters.search)
    window.open(`/api/transactions?${params}`, '_blank')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">Transactions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {total} transaction{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary text-xs">
            📥 Export CSV
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs">
            📤 Import CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17zM10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 014.293 8.293l5-5A1 1 0 0110 3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
              Income
            </p>
            <p className={`text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300 transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
              {formatCurrency(summary.totalIncome, currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 014.293 8.293l5-5A1 1 0 0110 3zM10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-500">
              Expenses
            </p>
            <p className={`text-base font-bold tabular-nums text-rose-700 dark:text-rose-300 transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
              {formatCurrency(summary.totalExpenses, currency)}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${
          net >= 0
            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            net >= 0
              ? 'bg-blue-100 dark:bg-blue-900/50'
              : 'bg-rose-100 dark:bg-rose-900/50'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${net >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-rose-600 dark:text-rose-500'}`}>
              Net
            </p>
            <p className={`text-base font-bold tabular-nums transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'} ${net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        onRefetch={refetch}
        currency={currency}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters({ page: filters.page - 1 })}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            ← Prev
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i
            return (
              <button
                key={p}
                onClick={() => setFilters({ page: p })}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                  ${filters.page === p
                    ? 'bg-primary text-white'
                    : 'btn-ghost'
                  }`}
              >
                {p}
              </button>
            )
          })}

          <button
            disabled={filters.page === totalPages}
            onClick={() => setFilters({ page: filters.page + 1 })}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Transaction" size="lg">
        <TransactionForm
          onSuccess={() => { setShowCreate(false); refetch() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Import Modal */}
      <ImportCSVModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
