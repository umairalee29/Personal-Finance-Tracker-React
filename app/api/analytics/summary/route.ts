import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import {
  buildSummaryPipeline,
  buildTopCategoriesPipeline,
} from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : startOfMonth(new Date())
    const endDate = endDateParam ? new Date(endDateParam) : endOfMonth(new Date())

    const userId = session.user.id

    // Current period
    const summaryAgg = await Transaction.aggregate(buildSummaryPipeline(userId, startDate, endDate))
    const summaryMap = Object.fromEntries(summaryAgg.map((s: { _id: string; total: number }) => [s._id, s.total]))
    const totalIncome = summaryMap['income'] ?? 0
    const totalExpenses = summaryMap['expense'] ?? 0
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    // Previous period for MoM change
    const prevStart = startOfMonth(subMonths(startDate, 1))
    const prevEnd = endOfMonth(subMonths(startDate, 1))
    const prevAgg = await Transaction.aggregate(buildSummaryPipeline(userId, prevStart, prevEnd))
    const prevMap = Object.fromEntries(prevAgg.map((s: { _id: string; total: number }) => [s._id, s.total]))
    const prevExpenses = prevMap['expense'] ?? 0
    const monthOverMonthChange =
      prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0

    // Top categories
    const topCatsRaw = await Transaction.aggregate(
      buildTopCategoriesPipeline(userId, startDate, endDate)
    )
    const topCategories = topCatsRaw.map((c: { categoryId: string; category: string; icon: string; color: string; total: number }) => ({
      categoryId: c.categoryId?.toString(),
      category: c.category ?? 'Unknown',
      icon: c.icon ?? '💰',
      color: c.color ?? '#6366f1',
      amount: c.total,
      percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
    }))

    return NextResponse.json({
      data: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        topCategories,
        monthOverMonthChange,
        previousMonthExpenses: prevExpenses,
      },
    })
  } catch (err) {
    console.error('[analytics summary]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
