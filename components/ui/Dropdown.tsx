'use client'

import { useState, useRef, useEffect } from 'react'

export interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Dropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 cursor-pointer
                   text-xs font-medium
                   bg-slate-50 dark:bg-slate-700/60
                   border border-slate-200 dark:border-slate-600
                   text-slate-700 dark:text-slate-300
                   rounded-lg px-3 py-1.5
                   hover:border-primary dark:hover:border-primary-400 hover:bg-white dark:hover:bg-slate-700
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                   transition-all duration-150 whitespace-nowrap"
      >
        <span>{selected?.label ?? 'Select'}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[9rem]
                     bg-white dark:bg-slate-800
                     border border-slate-200 dark:border-slate-700
                     rounded-xl shadow-lg overflow-hidden
                     animate-fade-in"
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-3
                            px-3 py-2 text-xs font-medium text-left
                            transition-colors duration-100 cursor-pointer
                            ${active
                              ? 'bg-primary/8 dark:bg-primary/15 text-primary dark:text-primary-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
              >
                <span>{opt.label}</span>
                {active && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
