import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { BudgetSchema } from '@/lib/validations'
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
      .populate('categoryId', 'name icon color group')
      .lean()

    // Compute spentAmount per budget using each budget's own date range
    const budgetsWithSpent = await Promise.all(budgets.map(async (b) => {
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
      return {
        ...b,
        spentAmount,
        remainingAmount: Math.max(0, b.limit - spentAmount),
        percentageUsed: b.limit > 0 ? (spentAmount / b.limit) * 100 : 0,
      }
    }))

    return NextResponse.json({ data: budgetsWithSpent })
  } catch (err) {
    console.error('[budgets GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = BudgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await connectDB()
    const budget = await Budget.create({
      ...parsed.data,
      userId: new Types.ObjectId(session.user.id),
    })
    const populated = await budget.populate('categoryId', 'name icon color group')
    return NextResponse.json({ data: populated }, { status: 201 })
  } catch (err) {
    console.error('[budgets POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
