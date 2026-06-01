'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency, getProgressColor } from '@/lib/formatters'
import { differenceInDays } from 'date-fns'
import type { IBudget } from '@/types'

interface BudgetCardProps {
  budget: IBudget & { spentAmount: number; remainingAmount: number; percentageUsed: number }
  currency?: string
  onRefetch: () => void
}

export function BudgetCard({ budget, currency = 'USD', onRefetch }: BudgetCardProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const pct = Math.min(100, budget.percentageUsed ?? 0)
  const cat = budget.category
  const daysLeft = differenceInDays(new Date(budget.endDate), new Date())
  const isExpired = daysLeft <= 0

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/budgets/${budget._id}`, { method: 'DELETE' })
      if (!res.ok) { showToast.error('Failed to delete budget'); return }
      showToast.success('Budget deleted')
      setShowDelete(false)
      onRefetch()
    } finally {
      setDeleting(false)
    }
  }

  const progressClass = getProgressColor(pct)

  return (
    <>
      <Card className={`flex flex-col gap-4 transition-opacity ${isExpired ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${!cat?.color ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              style={cat?.color ? { backgroundColor: `${cat.color}26` } : undefined}
            >
              {cat?.icon ?? '💰'}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {budget.name}
              </h3>
              {isExpired
                ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Expired</span>
                : <Badge variant="default" className="text-xs capitalize">{budget.period}</Badge>
              }
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowEdit(true)}
              title="Edit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDelete(true)}
              title="Delete"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Amounts */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-heading font-bold tabular text-slate-900 dark:text-slate-100">
                {formatCurrency(budget.spentAmount ?? 0, currency)}
              </span>
              <span className="text-sm text-slate-400 ml-1">
                / {formatCurrency(budget.limit, currency)}
              </span>
            </div>
            <span className={`text-sm font-semibold tabular ${pct >= 90 ? 'text-rose-600 dark:text-rose-400' : pct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {pct.toFixed(0)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`progress-bar ${isExpired ? 'bg-slate-400 dark:bg-slate-500' : progressClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {formatCurrency(budget.remainingAmount ?? 0, currency)} remaining
          </span>
          <span>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Period ended'}
          </span>
        </div>

        {/* Alert if over threshold */}
        {(budget.percentageUsed ?? 0) >= budget.alertThreshold && (
          <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2">
            ⚠️ Over {budget.alertThreshold}% of budget used
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Budget" size="md">
        <BudgetForm
          budget={budget}
          onSuccess={() => { setShowEdit(false); onRefetch() }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Budget" size="sm">
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Delete budget <strong>&quot;{budget.name}&quot;</strong>? This won&apos;t affect existing transactions.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
