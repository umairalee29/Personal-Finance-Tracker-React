import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { BudgetSchema } from '@/lib/validations'
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

    const budgetsWithSpent = await enrichBudgetsWithSpending(budgets, userId)
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
