'use client'

interface RangeSelectorProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function RangeSelector<T extends string>({ options, value, onChange }: RangeSelectorProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${value === opt.value ? 'bg-primary text-white' : 'btn-secondary'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
