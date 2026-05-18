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
  const cat = budget.category as unknown as { icon?: string; name?: string }
  const daysLeft = differenceInDays(new Date(budget.endDate), new Date())

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/budgets/${(budget as unknown as { _id: string })._id}`, { method: 'DELETE' })
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
      <Card className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">
              {cat?.icon ?? '💰'}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {budget.name}
              </h3>
              <Badge variant="default" className="text-xs capitalize">{budget.period}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowEdit(true)} className="btn-ghost !p-1.5 text-sm" title="Edit">✏️</button>
            <button onClick={() => setShowDelete(true)} className="btn-ghost !p-1.5 text-sm text-rose-500" title="Delete">🗑</button>
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
              className={`progress-bar ${progressClass}`}
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
