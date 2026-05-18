import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatCurrency(
  amount: number,
  currency = 'USD',
  compact = false
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(amount)
}

export function formatDate(date: Date | string, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, fmt)
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatShortDate(date: Date | string): string {
  return formatDate(date, 'MMM d')
}

export function formatMonthYear(date: Date | string): string {
  return formatDate(date, 'MMMM yyyy')
}

export function parseAmount(raw: string): number {
  // Strip currency symbols, commas, spaces
  const cleaned = raw.replace(/[^0-9.\-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-rose-600'
  if (percentage >= 90) return 'bg-rose-500'
  if (percentage >= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function getDeltaColor(delta: number): string {
  return delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}
