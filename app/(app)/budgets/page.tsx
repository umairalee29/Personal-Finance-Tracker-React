'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useBudgets } from '@/hooks/useBudgets'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { Modal } from '@/components/ui/Modal'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/formatters'

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="flex justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="font-heading font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">
        No budgets yet
      </h3>
      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
        Create your first budget to start tracking spending against goals.
      </p>
      <button onClick={onAdd} className="mt-5 btn-primary text-sm inline-flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        New Budget
      </button>
    </div>
  )
}

export default function BudgetsPage() {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'USD'
  const { budgets, alerts, isLoading, error, refetch } = useBudgets()
  const [showCreate, setShowCreate] = useState(false)

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount ?? 0), 0)
  const totalRemaining = budgets.reduce((sum, b) => sum + (b.remainingAmount ?? 0), 0)

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

      {/* Summary strip */}
      {(isLoading || budgets.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Budgeted</p>
              {isLoading ? <Skeleton className="h-5 w-20 mt-0.5" /> : <p className="text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(totalBudgeted, currency)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-rose-100 dark:bg-rose-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-500">Spent</p>
              {isLoading ? <Skeleton className="h-5 w-20 mt-0.5" /> : <p className="text-base font-bold tabular-nums text-rose-700 dark:text-rose-300">{formatCurrency(totalSpent, currency)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">Remaining</p>
              {isLoading ? <Skeleton className="h-5 w-20 mt-0.5" /> : <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRemaining, currency)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : budgets.length === 0
          ? <EmptyState onAdd={() => setShowCreate(true)} />
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
