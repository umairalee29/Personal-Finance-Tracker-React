import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ProfileUpdateSchema } from '@/lib/validations'
import User from '@/models/User'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = ProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await connectDB()
    const user = await User.findByIdAndUpdate(session.user.id, parsed.data, { new: true }).lean()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ data: { name: user.name, email: user.email, currency: user.currency, monthlyIncomeGoal: user.monthlyIncomeGoal } })
  } catch (err) {
    console.error('[profile patch]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  await User.findByIdAndDelete(session.user.id)
  return NextResponse.json({ message: 'Account deleted' })
}
