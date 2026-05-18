import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Budget from '@/models/Budget'
import Transaction from '@/models/Transaction'
import { Types } from 'mongoose'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const userId = new Types.ObjectId(session.user.id)
    const budgets = await Budget.find({ userId })
      .populate('categoryId', 'name icon color')
      .lean()

    const now = new Date()
    const spentAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
          type: 'expense',
        },
      },
      { $group: { _id: '$categoryId', spentAmount: { $sum: '$amount' } } },
    ])
    const spentMap = new Map(spentAgg.map((s) => [s._id.toString(), s.spentAmount]))

    const alerts = budgets
      .map((b) => {
        const catId = (b.categoryId as unknown as { _id: Types.ObjectId })?._id?.toString() ?? ''
        const spentAmount = spentMap.get(catId) ?? 0
        const percentageUsed = b.limit > 0 ? (spentAmount / b.limit) * 100 : 0
        return { ...b, spentAmount, percentageUsed }
      })
      .filter((b) => b.percentageUsed >= b.alertThreshold)

    return NextResponse.json({ data: alerts })
  } catch (err) {
    console.error('[budget alerts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
