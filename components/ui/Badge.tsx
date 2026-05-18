import type { TransactionType, TransactionStatus } from '@/types'

type BadgeVariant =
  | TransactionType
  | TransactionStatus
  | 'default'
  | 'warning'
  | 'success'
  | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expense: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cleared: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  reconciled: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                  text-xs font-medium capitalize
                  ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
