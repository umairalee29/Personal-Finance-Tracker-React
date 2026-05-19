import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import {
  buildSummaryPipeline,
  buildTopCategoriesPipeline,
  buildTrendsPipeline,
  buildCategoryBreakdownPipeline,
  buildHeatmapPipeline,
  fillHeatmapGaps,
} from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import Budget from '@/models/Budget'
import { Types } from 'mongoose'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()

    const userId = session.user.id
    const userObjectId = new Types.ObjectId(userId)
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const prevStart = startOfMonth(subMonths(now, 1))
    const prevEnd = endOfMonth(subMonths(now, 1))
    const year = now.getFullYear()
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))

    // Run all queries in parallel — one DB round-trip instead of six HTTP requests
    const [
      summaryAgg,
      prevAgg,
      topCatsRaw,
      trendsRaw,
      categoriesRaw,
      heatmapRaw,
      budgets,
      spentAgg,
    ] = await Promise.all([
      Transaction.aggregate(buildSummaryPipeline(userId, monthStart, monthEnd)),
      Transaction.aggregate(buildSummaryPipeline(userId, prevStart, prevEnd)),
      Transaction.aggregate(buildTopCategoriesPipeline(userId, monthStart, monthEnd)),
      Transaction.aggregate(buildTrendsPipeline(userId, 6)),
      Transaction.aggregate(buildCategoryBreakdownPipeline(userId, monthStart, monthEnd, 'expense')),
      Transaction.aggregate(buildHeatmapPipeline(userId, year)),
      Budget.find({ userId: userObjectId }).populate('categoryId', 'name icon color group').lean(),
      Transaction.aggregate([
        { $match: { userId: userObjectId, date: { $gte: monthStart, $lte: monthEnd }, type: 'expense' } },
        { $group: { _id: '$categoryId', spentAmount: { $sum: '$amount' } } },
      ]),
    ])

    // ── Summary ────────────────────────────────────────────────────────────────
    const summaryMap = Object.fromEntries(
      summaryAgg.map((s: { _id: string; total: number }) => [s._id, s.total])
    )
    const prevMap = Object.fromEntries(
      prevAgg.map((s: { _id: string; total: number }) => [s._id, s.total])
    )
    const totalIncome = summaryMap['income'] ?? 0
    const totalExpenses = summaryMap['expense'] ?? 0
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
    const prevExpenses = prevMap['expense'] ?? 0
    const monthOverMonthChange =
      prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0

    const topCategories = topCatsRaw.map(
      (c: { categoryId: string; category: string; icon: string; color: string; total: number }) => ({
        categoryId: c.categoryId?.toString(),
        category: c.category ?? 'Unknown',
        icon: c.icon ?? '💰',
        color: c.color ?? '#6366f1',
        amount: c.total,
        percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
      })
    )

    // ── Trends ─────────────────────────────────────────────────────────────────
    const trendsMap: Record<string, { income: number; expenses: number }> = {}
    trendsRaw.forEach((r: { _id: { year: number; month: number; type: string }; total: number }) => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`
      if (!trendsMap[key]) trendsMap[key] = { income: 0, expenses: 0 }
      if (r._id.type === 'income') trendsMap[key].income = r.total
      if (r._id.type === 'expense') trendsMap[key].expenses = r.total
    })
    const trends = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
        ...vals,
        netSavings: vals.income - vals.expenses,
      }))

    // ── Category breakdown ─────────────────────────────────────────────────────
    const catTotal = categoriesRaw.reduce(
      (sum: number, c: { total: number }) => sum + c.total, 0
    )
    const monthsSpan = 1
    const categories = categoriesRaw.map(
      (c: { categoryId: string; category: string; icon: string; color: string; total: number; count: number }) => ({
        categoryId: c.categoryId?.toString(),
        category: c.category ?? 'Unknown',
        icon: c.icon ?? '💰',
        color: c.color ?? '#6366f1',
        total: c.total,
        percentage: catTotal > 0 ? (c.total / catTotal) * 100 : 0,
        avgPerMonth: c.total / monthsSpan,
        transactionCount: c.count,
      })
    )

    // ── Heatmap ────────────────────────────────────────────────────────────────
    const heatmapRawFormatted = heatmapRaw.map(
      (d: { _id: { year: number; month: number; day: number }; total: number; count: number }) => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
        total: d.total,
        count: d.count,
      })
    )
    const heatmap = fillHeatmapGaps(heatmapRawFormatted, year)
    const maxTotal = Math.max(...heatmap.map((d) => d.total), 1)

    // ── Budgets ────────────────────────────────────────────────────────────────
    const spentMap = new Map(spentAgg.map((s: { _id: Types.ObjectId; spentAmount: number }) => [s._id.toString(), s.spentAmount]))

    const budgetsWithSpent = budgets.map((b) => {
      const catId = (b.categoryId as unknown as { _id: Types.ObjectId })?._id?.toString() ?? ''
      const spentAmount = spentMap.get(catId) ?? 0
      const percentageUsed = b.limit > 0 ? (spentAmount / b.limit) * 100 : 0
      return { ...b, spentAmount, remainingAmount: Math.max(0, b.limit - spentAmount), percentageUsed }
    })

    const alerts = budgetsWithSpent.filter((b) => b.percentageUsed >= b.alertThreshold)

    return NextResponse.json({
      summary: { totalIncome, totalExpenses, netSavings, savingsRate, topCategories, monthOverMonthChange, previousMonthExpenses: prevExpenses },
      trends,
      categories,
      heatmap,
      maxTotal,
      budgets: budgetsWithSpent,
      alerts,
    })
  } catch (err) {
    console.error('[dashboard GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
