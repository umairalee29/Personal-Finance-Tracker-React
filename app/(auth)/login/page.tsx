'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginSchema, type LoginInput } from '@/lib/validations'
import { showToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        showToast.error('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setValue('email', 'demo@wealthlens.com')
    setValue('password', 'demo1234')
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">💎</div>
        <h1 className="font-heading font-bold text-2xl text-slate-900 dark:text-slate-100">
          Welcome back
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Sign in to your WealthLens account
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="input"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-white dark:bg-slate-800 px-2">or</span>
            </div>
          </div>

          {/* Demo login */}
          <button
            type="button"
            onClick={fillDemo}
            className="btn-secondary w-full"
          >
            🎭 Use Demo Account
          </button>
        </form>
      </div>

      <p className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary dark:text-primary-300 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
