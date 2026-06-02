import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, eachDayOfInterval, format, subDays, startOfDay, startOfWeek, subWeeks } from 'date-fns'
import { Types } from 'mongoose'
import type { PipelineStage } from 'mongoose'
import Transaction from '@/models/Transaction'

// ─── Summary Pipeline ────────────────────────────────────────────────────────

export function buildSummaryPipeline(
  userId: string,
  startDate: Date,
  endDate: Date
): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate, $lte: endDate },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]
}

export function buildTopCategoriesPipeline(
  userId: string,
  startDate: Date,
  endDate: Date
): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate, $lte: endDate },
        type: 'expense',
      },
    },
    {
      $group: {
        _id: '$categoryId',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        categoryId: '$_id',
        category: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        total: 1,
      },
    },
  ] as PipelineStage[]
}

// ─── Trends Pipeline ──────────────────────────────────────────────────────────

export function buildTrendsPipeline(userId: string, months: number): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  const startDate = startOfMonth(subMonths(new Date(), months - 1))
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 } as Record<string, 1 | -1>,
    },
  ] as PipelineStage[]
}

// ─── Daily Trends Pipeline ────────────────────────────────────────────────────

export function buildDailyTrendsPipeline(userId: string, days: number): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  const start = subDays(startOfDay(new Date()), days - 1)
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: start },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } as Record<string, 1 | -1> },
  ] as PipelineStage[]
}

// ─── Weekly Trends Pipeline ───────────────────────────────────────────────────

export function buildWeeklyTrendsPipeline(userId: string, weeks: number): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  const start = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 })
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: start },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$date' },
          week: { $isoWeek: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } as Record<string, 1 | -1> },
  ] as PipelineStage[]
}

// ─── Category Breakdown Pipeline ──────────────────────────────────────────────

export function buildCategoryBreakdownPipeline(
  userId: string,
  startDate: Date,
  endDate: Date,
  type: 'income' | 'expense' = 'expense'
): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate, $lte: endDate },
        type,
      },
    },
    {
      $group: {
        _id: '$categoryId',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        categoryId: '$_id',
        category: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        total: 1,
        count: 1,
      },
    },
  ] as PipelineStage[]
}

// ─── Heatmap Pipeline ────────────────────────────────────────────────────────

export function buildHeatmapPipeline(userId: string, year: number): PipelineStage[] {
  const userObjectId = new Types.ObjectId(userId)
  const startDate = startOfYear(new Date(year, 0, 1))
  const endDate = endOfYear(new Date(year, 0, 1))
  return [
    {
      $match: {
        userId: userObjectId,
        date: { $gte: startDate, $lte: endDate },
        type: 'expense',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } as Record<string, 1 | -1>,
    },
  ] as PipelineStage[]
}

// ─── Budget Enrichment ────────────────────────────────────────────────────────

interface RawBudgetLean {
  _id: Types.ObjectId
  limit: number
  startDate: Date
  endDate: Date
  alertThreshold: number
  categoryId: unknown
  [key: string]: unknown
}

export async function enrichBudgetsWithSpending<T extends RawBudgetLean>(
  budgets: T[],
  userId: Types.ObjectId
) {
  return Promise.all(
    budgets.map(async (b) => {
      const catId = (b.categoryId as { _id: Types.ObjectId } | null)?._id
      const [result] = await Transaction.aggregate([
        {
          $match: {
            userId,
            ...(catId && { categoryId: catId }),
            date: { $gte: new Date(b.startDate), $lte: new Date(b.endDate) },
            type: 'expense',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      const spentAmount = result?.total ?? 0
      const { categoryId, ...rest } = b
      return {
        ...rest,
        category: categoryId,
        spentAmount,
        remainingAmount: Math.max(0, b.limit - spentAmount),
        percentageUsed: b.limit > 0 ? (spentAmount / b.limit) * 100 : 0,
      }
    })
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDateRange(preset: '1m' | '3m' | '6m' | '12m' | string): {
  startDate: Date
  endDate: Date
} {
  const now = new Date()
  const monthMap: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }
  const months = monthMap[preset] ?? 1
  return {
    startDate: startOfMonth(subMonths(now, months - 1)),
    endDate: endOfMonth(now),
  }
}

export function fillHeatmapGaps(
  rawData: { date: string; total: number; count: number }[],
  year: number
): { date: string; total: number; count: number }[] {
  const startDate = startOfYear(new Date(year, 0, 1))
  const endDate = endOfYear(new Date(year, 0, 1))
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
  const dataMap = new Map(rawData.map((d) => [d.date, d]))
  return allDays.map((day) => {
    const key = format(day, 'yyyy-MM-dd')
    return dataMap.get(key) ?? { date: key, total: 0, count: 0 }
  })
}
