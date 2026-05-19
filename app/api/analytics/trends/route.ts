import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { buildTrendsPipeline, buildDailyTrendsPipeline, buildWeeklyTrendsPipeline } from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import {
  format, subMonths, startOfMonth,
  subDays, startOfDay,
  subWeeks, startOfWeek, getISOWeek, getISOWeekYear,
} from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const granularity = searchParams.get('granularity') ?? '6m'
    const now = new Date()

    // ── Daily ────────────────────────────────────────────────────────────────
    if (granularity === 'daily') {
      const raw = await Transaction.aggregate(buildDailyTrendsPipeline(session.user.id, 30)) as Array<{
        _id: { year: number; month: number; day: number; type: string }
        total: number
      }>

      const dayRange = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(startOfDay(now), 29 - i)
        return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: format(d, 'MMM d') }
      })

      const dataMap = new Map<string, { income: number; expenses: number }>()
      for (const row of raw) {
        const key = `${row._id.year}-${row._id.month}-${row._id.day}`
        if (!dataMap.has(key)) dataMap.set(key, { income: 0, expenses: 0 })
        const entry = dataMap.get(key)!
        if (row._id.type === 'income') entry.income = row.total
        if (row._id.type === 'expense') entry.expenses = row.total
      }

      const trends = dayRange.map(({ key, label }) => {
        const e = dataMap.get(key) ?? { income: 0, expenses: 0 }
        return { month: label, income: e.income, expenses: e.expenses, netSavings: e.income - e.expenses }
      })

      return NextResponse.json({ data: trends })
    }

    // ── Weekly ───────────────────────────────────────────────────────────────
    if (granularity === 'weekly') {
      const raw = await Transaction.aggregate(buildWeeklyTrendsPipeline(session.user.id, 12)) as Array<{
        _id: { year: number; week: number; type: string }
        total: number
      }>

      const weekRange = Array.from({ length: 12 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(now, 11 - i), { weekStartsOn: 1 })
        return {
          key: `${getISOWeekYear(weekStart)}-${getISOWeek(weekStart)}`,
          label: format(weekStart, 'MMM d'),
        }
      })

      const dataMap = new Map<string, { income: number; expenses: number }>()
      for (const row of raw) {
        const key = `${row._id.year}-${row._id.week}`
        if (!dataMap.has(key)) dataMap.set(key, { income: 0, expenses: 0 })
        const entry = dataMap.get(key)!
        if (row._id.type === 'income') entry.income = row.total
        if (row._id.type === 'expense') entry.expenses = row.total
      }

      const trends = weekRange.map(({ key, label }) => {
        const e = dataMap.get(key) ?? { income: 0, expenses: 0 }
        return { month: label, income: e.income, expenses: e.expenses, netSavings: e.income - e.expenses }
      })

      return NextResponse.json({ data: trends })
    }

    // ── Monthly / 6m / 1y ────────────────────────────────────────────────────
    const months = granularity === 'monthly' ? 3 : granularity === '1y' ? 12 : 6
    const raw = await Transaction.aggregate(buildTrendsPipeline(session.user.id, months)) as Array<{
      _id: { year: number; month: number; type: string }
      total: number
    }>

    const monthRange = Array.from({ length: months }, (_, i) => {
      const d = startOfMonth(subMonths(now, months - 1 - i))
      return { key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: format(d, 'MMM yyyy') }
    })

    const dataMap = new Map<string, { income: number; expenses: number }>()
    for (const row of raw) {
      const key = `${row._id.year}-${row._id.month}`
      if (!dataMap.has(key)) dataMap.set(key, { income: 0, expenses: 0 })
      const entry = dataMap.get(key)!
      if (row._id.type === 'income') entry.income = row.total
      if (row._id.type === 'expense') entry.expenses = row.total
    }

    const trends = monthRange.map(({ key, label }) => {
      const e = dataMap.get(key) ?? { income: 0, expenses: 0 }
      return { month: label, income: e.income, expenses: e.expenses, netSavings: e.income - e.expenses }
    })

    return NextResponse.json({ data: trends })
  } catch (err) {
    console.error('[analytics trends]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
