'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useStore } from '@/store'
import type { ITransaction } from '@/types'

interface TransactionTableProps {
  transactions: ITransaction[]
  isLoading: boolean
  onRefetch: () => void
  currency?: string
}

type SortKey = 'date' | 'amount' | 'description'

export function TransactionTable({ transactions, isLoading, onRefetch, currency = 'USD' }: TransactionTableProps) {
  const { filters, setFilters } = useStore()
  const [editTarget, setEditTarget] = useState<ITransaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ITransaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSort = (key: SortKey) => {
    if (filters.sortBy === key) {
      setFilters({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilters({ sortBy: key, sortDir: 'desc' })
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (filters.sortBy !== col) return <span className="text-slate-300">↕</span>
    return <span className="text-primary">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/transactions/${(deleteTarget as unknown as { _id: string })._id}`, { method: 'DELETE' })
      if (!res.ok) { showToast.error('Failed to delete transaction'); return }
      showToast.success('Transaction deleted')
      setDeleteTarget(null)
      onRefetch()
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) return <SkeletonTable rows={8} />

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No transactions found</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or add a new transaction</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {[
                { key: 'date' as SortKey, label: 'Date' },
                { key: 'description' as SortKey, label: 'Description' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                  onClick={() => handleSort(key)}
                >
                  {label} <SortIcon col={key} />
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                onClick={() => handleSort('amount')}
              >
                Amount <SortIcon col="amount" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => {
              const cat = t.categoryId as unknown as { icon?: string; name?: string }
              const isIncome = t.type === 'income'
              const isTransfer = t.type === 'transfer'
              const rowBorder = isIncome
                ? 'border-l-4 border-l-emerald-500'
                : isTransfer
                ? 'border-l-4 border-l-blue-500'
                : 'border-l-4 border-l-rose-500'
              const rowHover = isIncome
                ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                : isTransfer
                ? 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                : 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
              return (
                <tr
                  key={String((t as unknown as { _id: string })._id)}
                  className={`transition-colors ${rowHover}`}
                >
                  <td className={`pl-3 pr-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap ${rowBorder}`}>
                    {formatDate(t.date, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                    <span className="truncate block">{t.description}</span>
                    {t.note && <span className="text-xs text-slate-400 truncate block">{t.note}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span>{cat?.icon ?? '💰'}</span>
                      <span className="text-xs">{cat?.name ?? '—'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.type}>{t.type}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold tabular whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isIncome ? '+' : isTransfer ? '⇄' : '−'}{formatCurrency(t.amount, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.status}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.tags?.map((tag) => (
                        <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditTarget(t)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Transaction" size="lg">
        {editTarget && (
          <TransactionForm
            transaction={editTarget}
            onSuccess={() => { setEditTarget(null); onRefetch() }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Transaction" size="sm">
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Are you sure you want to delete <strong>&quot;{deleteTarget?.description}&quot;</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
