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
import { getActiveDateLabel } from '@/lib/datePresets'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── Summary strip ────────────────────────────────────────────────────────────

const INCOME_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17zM10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 014.293 8.293l5-5A1 1 0 0110 3z" clipRule="evenodd" />
  </svg>
)
const EXPENSE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 014.293 8.293l5-5A1 1 0 0110 3zM10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" />
  </svg>
)
const NET_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
  </svg>
)

interface SummaryCardProps {
  label: string
  value: string
  icon: React.ReactNode
  loading: boolean
  card: string   // bg + border classes
  iconBox: string // icon wrapper bg classes
  iconColor: string
  labelColor: string
  valueColor: string
}

function SummaryCard({ label, value, icon, loading, card, iconBox, iconColor, labelColor, valueColor }: SummaryCardProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${card}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
        {loading
          ? <Skeleton className="h-5 w-20 mt-0.5" />
          : <p className={`text-base font-bold tabular-nums ${valueColor}`}>{value}</p>
        }
      </div>
    </div>
  )
}

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

  const dateLabel = getActiveDateLabel(filters.startDate, filters.endDate)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">
            Transactions
            <span className="ml-2 text-slate-400 dark:text-slate-500 font-normal">· {dateLabel}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {total} transaction{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary text-xs flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export CSV
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Income"
          value={formatCurrency(summary.totalIncome, currency)}
          icon={INCOME_ICON}
          loading={isLoading}
          card="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
          iconBox="bg-emerald-100 dark:bg-emerald-900/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          labelColor="text-emerald-600 dark:text-emerald-500"
          valueColor="text-emerald-700 dark:text-emerald-300"
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(summary.totalExpenses, currency)}
          icon={EXPENSE_ICON}
          loading={isLoading}
          card="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
          iconBox="bg-rose-100 dark:bg-rose-900/50"
          iconColor="text-rose-600 dark:text-rose-400"
          labelColor="text-rose-600 dark:text-rose-500"
          valueColor="text-rose-700 dark:text-rose-300"
        />
        <SummaryCard
          label="Net"
          value={`${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net), currency)}`}
          icon={NET_ICON}
          loading={isLoading}
          card={net >= 0
            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 transition-colors duration-300'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 transition-colors duration-300'}
          iconBox={net >= 0 ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-rose-100 dark:bg-rose-900/50'}
          iconColor={net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}
          labelColor={net >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-rose-600 dark:text-rose-500'}
          valueColor={net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}
        />
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
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
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

          <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            Showing{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)}
            </span>
            {' '}of{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">{total}</span>
            {' '}transactions
          </p>
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
