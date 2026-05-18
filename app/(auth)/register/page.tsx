'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RegisterSchema, type RegisterInput } from '@/lib/validations'
import { showToast } from '@/components/ui/Toast'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { currency: 'USD', monthlyIncomeGoal: 0 },
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        showToast.error(body.error ?? 'Registration failed')
        return
      }

      // Auto sign-in after registration
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">💎</div>
        <h1 className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100">
          Create your account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Start tracking your finances with WealthLens
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
            <input {...register('name')} placeholder="Alex Johnson" className="input" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="input" />
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm</label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="input" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
            <select {...register('currency')} className="select">
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly income goal <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('monthlyIncomeGoal')}
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              className="input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary dark:text-primary-300 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
