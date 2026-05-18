import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { RegisterSchema } from '@/lib/validations'
import User from '@/models/User'
import Category from '@/models/Category'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, currency, monthlyIncomeGoal } = parsed.data

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash, currency, monthlyIncomeGoal })

    // Clone system categories for the new user
    const systemCategories = await Category.find({ isDefault: true, userId: null }).lean()
    if (systemCategories.length > 0) {
      await Category.insertMany(
        systemCategories.map(({ _id: _ignored, ...cat }) => ({
          ...cat,
          userId: user._id,
          isDefault: false,
        }))
      )
    }

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
