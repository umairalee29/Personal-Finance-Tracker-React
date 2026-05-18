'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useBudgets } from '@/hooks/useBudgets'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatMonthYear } from '@/lib/formatters'

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="mb-6 text-slate-200 dark:text-slate-700">
        <circle cx="60" cy="60" r="50" fill="currentColor" />
        <text x="60" y="75" textAnchor="middle" fontSize="40">🎯</text>
      </svg>
      <h3 className="font-heading font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">
        No budgets yet
      </h3>
      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
        Create your first budget to start tracking spending against goals.
      </p>
    </div>
  )
}

export default function BudgetsPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const { budgets, alerts, isLoading, refetch } = useBudgets()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">
            {formatMonthYear(new Date())} Budgets
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''} active
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New Budget
        </button>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                {alerts.length} budget{alerts.length > 1 ? 's are' : ' is'} over the alert threshold
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                {alerts.map((a) => {
                  const cat = a.category as unknown as { name?: string }
                  return cat?.name ?? a.name
                }).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : budgets.length === 0
          ? <EmptyState />
          : budgets.map((b) => (
              <BudgetCard
                key={String((b as unknown as { _id: string })._id)}
                budget={b}
                currency={currency}
                onRefetch={refetch}
              />
            ))
        }
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Budget" size="md">
        <BudgetForm
          onSuccess={() => { setShowCreate(false); refetch() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  )
}
