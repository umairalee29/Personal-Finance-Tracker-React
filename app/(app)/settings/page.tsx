'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProfileUpdateSchema } from '@/lib/validations'
import { CategorySchema, type CategoryInput } from '@/lib/validations'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import type { ICategory } from '@/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']

function ProfileSection() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
      monthlyIncomeGoal: 0,
    },
  })

  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name ?? '',
        currency: session.user.currency ?? 'USD',
        monthlyIncomeGoal: session.user.monthlyIncomeGoal ?? 0,
      })
    }
  }, [session, reset])

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { showToast.error('Failed to update profile'); return }
      await update(data)
      showToast.success('Profile updated')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
          <input {...register('name')} className="input" />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{String(errors.name.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
          <input value={session?.user?.email ?? ''} disabled className="input opacity-60 cursor-not-allowed" />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
            <select {...register('currency')} className="select">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monthly income goal</label>
            <input {...register('monthlyIncomeGoal')} type="number" min="0" step="100" className="input" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Card>
  )
}

function CategoryManager() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { group: 'other', icon: '💡', color: '#94a3b8' },
  })

  const fetchCats = useCallback(() =>
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories((j.data ?? []).filter((c: ICategory) => !c.isDefault)))
  , [])

  useEffect(() => { fetchCats() }, [fetchCats])

  const onCreate = async (data: CategoryInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { showToast.error('Failed to create category'); return }
      showToast.success('Category created')
      setShowCreate(false)
      reset()
      fetchCats()
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) { showToast.error('Failed to delete category'); return }
      showToast.success('Category deleted')
      setDeleteTarget(null)
      fetchCats()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Categories</CardTitle>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">+ Add</button>
      </CardHeader>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No custom categories yet</p>
      ) : (
        <div className="overflow-y-auto max-h-[288px] space-y-2 pr-1">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xl">{cat.icon}</span>
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{cat.name}</span>
              <span className="text-xs text-slate-400 capitalize">{cat.group}</span>
              <button
                onClick={() => setDeleteTarget(cat)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Category" size="sm">
        <form onSubmit={handleSubmit(onCreate)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input {...register('name')} className="input" placeholder="Pet supplies" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Icon (emoji)</label>
              <input {...register('icon')} className="input" placeholder="🐾" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color (hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={watch('color')}
                  onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input {...register('color')} className="input flex-1" placeholder="#94a3b8" />
              </div>
              {errors.color && <p className="mt-1 text-xs text-rose-600">{errors.color.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Group</label>
            <select {...register('group')} className="select">
              {['housing','food','transport','health','entertainment','shopping','savings','income','utilities','education','travel','pets','insurance','subscriptions','other'].map((g) => (
                <option key={g} value={g} className="capitalize">{g}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm">
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Delete category <strong>&quot;{deleteTarget?.name}&quot;</strong>? This won&apos;t affect existing transactions.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={onDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

function DataSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleExport = () => {
    window.open('/api/transactions?export=true', '_blank')
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'delete my account') return
    setDeleting(true)
    try {
      await fetch('/api/auth/profile', { method: 'DELETE' })
      signOut({ callbackUrl: '/login' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Data & Privacy</CardTitle></CardHeader>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export all transactions</p>
            <p className="text-xs text-slate-400">Download a CSV of all your transactions</p>
          </div>
          <button onClick={handleExport} className="btn-secondary text-xs">Export CSV</button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <div>
            <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Delete account</p>
            <p className="text-xs text-rose-600 dark:text-rose-500">Permanently delete your account and all data</p>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-xs">Delete</button>
        </div>
      </div>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will permanently delete your account and all associated data. Type{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-rose-600">delete my account</code>{' '}
            to confirm.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            className="input"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'delete my account' || deleting}
              className="btn-danger flex-1"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-slate-100">Settings</h2>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <ProfileSection />
        <CategoryManager />
      </div>
      <DataSection />
    </div>
  )
}
