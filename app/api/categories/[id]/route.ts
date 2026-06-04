import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { CategoryUpdateSchema } from '@/lib/validations'
import Category from '@/models/Category'
import { Types } from 'mongoose'

interface Params { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json()
    const parsed = CategoryUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await connectDB()
    const category = await Category.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      parsed.data,
      { new: true }
    ).lean()

    if (!category) return NextResponse.json({ error: 'Not found or not editable' }, { status: 404 })
    return NextResponse.json({ data: category })
  } catch (err) {
    console.error('[category PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    await connectDB()

    const category = await Category.findOne({ _id: params.id, userId: session.user.id, isDefault: false })
    if (!category) return NextResponse.json({ error: 'Not found or cannot delete default category' }, { status: 404 })

    await category.deleteOne()
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    console.error('[category DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
