import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Budget from '@/models/Budget'
import Transaction from '@/models/Transaction'
import { Types } from 'mongoose'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const userId = new Types.ObjectId(session.user.id)
    const budgets = await Budget.find({ userId })
      .populate('categoryId', 'name icon color')
      .lean()

    const enriched = await Promise.all(budgets.map(async (b) => {
      const catId = (b.categoryId as unknown as { _id: Types.ObjectId })?._id
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
      const percentageUsed = b.limit > 0 ? (spentAmount / b.limit) * 100 : 0
      const { categoryId, ...rest } = b
      return { ...rest, category: categoryId, spentAmount, percentageUsed }
    }))

    const alerts = enriched.filter((b) => b.percentageUsed >= b.alertThreshold)
    return NextResponse.json({ data: alerts })
  } catch (err) {
    console.error('[budget alerts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
