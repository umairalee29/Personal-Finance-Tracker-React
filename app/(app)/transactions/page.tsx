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

export default function TransactionsPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const { filters, setFilters } = useStore()
  const { transactions, total, totalPages, isLoading, refetch } = useTransactions()
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)

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
