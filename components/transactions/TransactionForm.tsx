'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TransactionSchema, type TransactionInput } from '@/lib/validations'
import { showToast } from '@/components/ui/Toast'
import type { ICategory, ITransaction } from '@/types'
import { format } from 'date-fns'

interface TransactionFormProps {
  transaction?: ITransaction
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>(transaction?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const isEdit = !!transaction

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          categoryId: String(transaction.categoryId),
          date: transaction.date,
          status: transaction.status,
          tags: transaction.tags,
          note: transaction.note,
          isRecurring: transaction.isRecurring,
          recurringInterval: transaction.recurringInterval,
        }
      : {
          type: 'expense',
          currency: 'USD',
          status: 'cleared',
          isRecurring: false,
          recurringInterval: null,
          date: new Date(),
        },
  })

  const isRecurring = watch('isRecurring')
  const type = watch('type')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
  }, [])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const onSubmit = async (data: TransactionInput) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/transactions/${transaction!.id}` : '/api/transactions'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tags }),
      })

      if (!res.ok) {
        const body = await res.json()
        showToast.error(body.error ?? 'Failed to save transaction')
        return
      }

      showToast.success(isEdit ? 'Transaction updated' : 'Transaction created')
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  const typeColors: Record<string, string> = {
    income: 'bg-emerald-500 text-white',
    expense: 'bg-rose-500 text-white',
    transfer: 'bg-blue-500 text-white',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <label key={t} className="flex-1 cursor-pointer">
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              <div className={`text-center py-2 rounded-lg text-sm font-medium border-2 transition-all
                ${type === t ? typeColors[t] + ' border-transparent' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
          <input
            {...register('amount')}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="input pl-7"
          />
        </div>
        {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
        <input {...register('description')} placeholder="Coffee shop, rent payment..." className="input" />
        {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>}
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
          <select {...register('categoryId')} className="select">
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={String(c.id ?? c)} value={String(c.id ?? (c as unknown as { _id: string })._id)}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-rose-600">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
          <Controller
            control={control}
            name="date"
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

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
        <select {...register('status')} className="select">
          <option value="cleared">Cleared</option>
          <option value="pending">Pending</option>
          <option value="reconciled">Reconciled</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-600">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add tag, press Enter"
            className="input flex-1"
          />
          <button type="button" onClick={addTag} className="btn-secondary px-3">Add</button>
        </div>
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-3">
        <input {...register('isRecurring')} type="checkbox" id="recurring" className="rounded border-slate-300" />
        <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          Recurring transaction
        </label>
      </div>
      {isRecurring && (
        <div>
          <select {...register('recurringInterval')} className="select">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Note <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea {...register('note')} rows={2} placeholder="Any additional notes..." className="input resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : isEdit ? 'Update Transaction' : 'Create Transaction'}
        </button>
      </div>
    </form>
  )
}
