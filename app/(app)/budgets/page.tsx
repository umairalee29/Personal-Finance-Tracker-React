'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useBudgets } from '@/hooks/useBudgets'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { Modal } from '@/components/ui/Modal'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
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
  const { budgets, alerts, isLoading, error, refetch } = useBudgets()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">
            {formatMonthYear(new Date())} Budgets
          </h2>
          {isLoading
            ? <Skeleton className="h-4 w-32 mt-1" />
            : <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} active</p>
          }
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New Budget
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
          <button onClick={refetch} className="ml-auto text-xs font-medium underline underline-offset-2 hover:no-underline">Retry</button>
        </div>
      )}

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
                key={String(b._id)}
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
