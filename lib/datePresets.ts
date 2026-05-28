export const DATE_PRESETS = [
  { label: 'Any time',      value: 'any' },
  { label: 'Today',         value: 'today' },
  { label: 'This week',     value: 'this-week' },
  { label: 'This month',    value: 'this-month' },
  { label: 'Last month',    value: 'last-month' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'This year',     value: 'this-year' },
] as const

export type DatePreset = typeof DATE_PRESETS[number]['value']

function fmt(d: Date) { return d.toISOString().split('T')[0] }

export function getPresetDates(preset: DatePreset): { startDate?: string; endDate?: string } {
  const now = new Date()
  const today = fmt(now)
  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today }
    case 'this-week': {
      const s = new Date(now); s.setDate(now.getDate() - now.getDay())
      return { startDate: fmt(s), endDate: today }
    }
    case 'this-month':
      return { startDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: today }
    case 'last-month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: fmt(s), endDate: fmt(e) }
    }
    case '3m':
      return { startDate: fmt(new Date(now.getFullYear(), now.getMonth() - 2, 1)), endDate: today }
    case '6m':
      return { startDate: fmt(new Date(now.getFullYear(), now.getMonth() - 5, 1)), endDate: today }
    case 'this-year':
      return { startDate: fmt(new Date(now.getFullYear(), 0, 1)), endDate: today }
    case 'any':
    default:
      return { startDate: undefined, endDate: undefined }
  }
}

export function getActiveDateLabel(startDate?: string, endDate?: string): string {
  // No filter — show current month
  if (!startDate && !endDate) {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  // Match against presets
  for (const p of DATE_PRESETS) {
    if (p.value === 'any') continue
    const { startDate: ps, endDate: pe } = getPresetDates(p.value)
    if (ps === startDate && pe === endDate) return p.label
  }
  // Custom range
  if (startDate && endDate) return `${startDate} → ${endDate}`
  if (startDate) return `From ${startDate}`
  return `Until ${endDate}`
}
