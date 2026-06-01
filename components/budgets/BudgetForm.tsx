'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BudgetSchema, type BudgetInput } from '@/lib/validations'
import { showToast } from '@/components/ui/Toast'
import { format } from 'date-fns'
import type { ICategory, IBudget } from '@/types'

interface BudgetFormProps {
  budget?: IBudget
  currency?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function BudgetForm({ budget, currency = 'USD', onSuccess, onCancel }: BudgetFormProps) {
  const currencySymbol = new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0 })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? currency
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(false)
  const isEdit = !!budget

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: budget
      ? {
          categoryId: String(budget.categoryId),
          name: budget.name,
          limit: budget.limit,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          alertThreshold: budget.alertThreshold,
        }
      : {
          period: 'monthly',
          startDate: defaultStart,
          endDate: defaultEnd,
          alertThreshold: 80,
        },
  })

  const alertThreshold = watch('alertThreshold')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
  }, [])

  const onSubmit = async (data: BudgetInput) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/budgets/${budget._id}` : '/api/budgets'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        showToast.error(body.error ?? 'Failed to save budget')
        return
      }
      showToast.success(isEdit ? 'Budget updated' : 'Budget created')
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
        <select {...register('categoryId')} className="select">
          <option value="">Select category...</option>
          {categories.map((c) => (
            <option key={String(c._id)} value={String(c._id)}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-rose-600">{errors.categoryId.message}</p>}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Budget name</label>
        <input {...register('name')} placeholder="Monthly groceries" className="input" />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      {/* Limit + Period */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Limit</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
            <input {...register('limit')} type="number" min="1" step="0.01" placeholder="500" className="input pl-7" />
          </div>
          {errors.limit && <p className="mt-1 text-xs text-rose-600">{errors.limit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period</label>
          <select {...register('period')} className="select">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start date</label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <input
                type="date"
                className="input"
                value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End date</label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <input
                type="date"
                className="input"
                value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
        </div>
      </div>

      {/* Alert threshold */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Alert threshold
          </label>
          <span className="text-sm font-semibold text-primary">{alertThreshold}%</span>
        </div>
        <input
          {...register('alertThreshold')}
          type="range"
          min="50"
          max="100"
          step="5"
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>50%</span>
          <span className="text-slate-500">Alert when spending reaches this %</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : isEdit ? 'Update Budget' : 'Create Budget'}
        </button>
      </div>
    </form>
  )
}
