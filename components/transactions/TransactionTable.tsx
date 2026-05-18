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
              return (
                <tr
                  key={String((t as unknown as { _id: string })._id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
                  <td className={`px-4 py-3 text-right font-semibold tabular whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
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
                        className="btn-ghost !p-1.5 text-xs"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="btn-ghost !p-1.5 text-xs text-rose-500 hover:text-rose-700"
                        title="Delete"
                      >
                        🗑
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
