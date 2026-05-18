import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { TransactionUpdateSchema } from '@/lib/validations'
import Transaction from '@/models/Transaction'
import { Types } from 'mongoose'

interface Params { params: { id: string } }

function isValidId(id: string) {
  return Types.ObjectId.isValid(id)
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  await connectDB()
  const transaction = await Transaction.findOne({
    _id: params.id,
    userId: session.user.id,
  }).populate('categoryId', 'name icon color group').lean()

  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: transaction })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const parsed = TransactionUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await connectDB()
    const transaction = await Transaction.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      parsed.data,
      { new: true }
    ).populate('categoryId', 'name icon color group').lean()

    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: transaction })
  } catch (err) {
    console.error('[transaction PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isValidId(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  await connectDB()
  const deleted = await Transaction.findOneAndDelete({ _id: params.id, userId: session.user.id })
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ message: 'Deleted' })
}
