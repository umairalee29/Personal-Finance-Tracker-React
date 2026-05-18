import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { BudgetUpdateSchema } from '@/lib/validations'
import Budget from '@/models/Budget'
import { Types } from 'mongoose'

interface Params { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const parsed = BudgetUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await connectDB()
    const budget = await Budget.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      parsed.data,
      { new: true }
    ).populate('categoryId', 'name icon color group').lean()

    if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: budget })
  } catch (err) {
    console.error('[budget PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  await connectDB()
  const deleted = await Budget.findOneAndDelete({ _id: params.id, userId: session.user.id })
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ message: 'Deleted' })
}
