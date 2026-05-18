import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { buildCategoryBreakdownPipeline } from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : startOfMonth(new Date())
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : endOfMonth(new Date())
    const type = (searchParams.get('type') ?? 'expense') as 'income' | 'expense'

    const raw = await Transaction.aggregate(
      buildCategoryBreakdownPipeline(session.user.id, startDate, endDate, type)
    )

    const total = (raw as Array<{ total: number }>).reduce((s, r) => s + r.total, 0)
    const monthCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))

    const data = (raw as Array<{ categoryId: string; category: string; icon: string; color: string; total: number; count: number }>).map((r) => ({
      categoryId: r.categoryId?.toString(),
      category: r.category ?? 'Unknown',
      icon: r.icon ?? '💰',
      color: r.color ?? '#6366f1',
      total: r.total,
      percentage: total > 0 ? (r.total / total) * 100 : 0,
      avgPerMonth: r.total / monthCount,
      transactionCount: r.count,
    }))

    return NextResponse.json({ data, total })
  } catch (err) {
    console.error('[analytics categories]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
