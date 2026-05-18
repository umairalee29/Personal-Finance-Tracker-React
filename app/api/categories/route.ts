import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { CategorySchema } from '@/lib/validations'
import Category from '@/models/Category'
import { Types } from 'mongoose'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const categories = await Category.find({
    $or: [
      { userId: new Types.ObjectId(session.user.id) },
      { isDefault: true, userId: null },
    ],
  }).sort({ group: 1, name: 1 }).lean()

  return NextResponse.json({ data: categories })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = CategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await connectDB()
    const category = await Category.create({
      ...parsed.data,
      userId: new Types.ObjectId(session.user.id),
      isDefault: false,
    })
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (err) {
    console.error('[categories POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
