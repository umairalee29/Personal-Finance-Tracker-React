import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { enrichBudgetsWithSpending } from '@/lib/analytics'
import Budget from '@/models/Budget'
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

    const enriched = await enrichBudgetsWithSpending(budgets, userId)
    const alerts = enriched.filter((b) => b.percentageUsed >= b.alertThreshold)
    return NextResponse.json({ data: alerts })
  } catch (err) {
    console.error('[budget alerts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
