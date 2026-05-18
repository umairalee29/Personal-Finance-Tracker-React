import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { buildTrendsPipeline } from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import { format, subMonths, startOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? '6m'
    const months = period === '12m' ? 12 : period === '3m' ? 3 : 6

    const raw = await Transaction.aggregate(buildTrendsPipeline(session.user.id, months))

    // Build complete month range (fill gaps with 0)
    const now = new Date()
    const monthRange = Array.from({ length: months }, (_, i) => {
      const d = startOfMonth(subMonths(now, months - 1 - i))
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: format(d, 'MMM yyyy') }
    })

    const dataMap = new Map<string, { income: number; expenses: number }>()
    for (const row of raw as Array<{ _id: { year: number; month: number; type: string }; total: number }>) {
      const key = `${row._id.year}-${row._id.month}`
      if (!dataMap.has(key)) dataMap.set(key, { income: 0, expenses: 0 })
      const entry = dataMap.get(key)!
      if (row._id.type === 'income') entry.income = row.total
      if (row._id.type === 'expense') entry.expenses = row.total
    }

    const trends = monthRange.map(({ year, month, label }) => {
      const key = `${year}-${month}`
      const entry = dataMap.get(key) ?? { income: 0, expenses: 0 }
      return {
        month: label,
        income: entry.income,
        expenses: entry.expenses,
        netSavings: entry.income - entry.expenses,
      }
    })

    return NextResponse.json({ data: trends })
  } catch (err) {
    console.error('[analytics trends]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
