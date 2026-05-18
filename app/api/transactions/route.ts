import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { TransactionSchema } from '@/lib/validations'
import Transaction from '@/models/Transaction'
import Category from '@/models/Category'
import { Types } from 'mongoose'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')
    const sortBy = searchParams.get('sortBy') ?? 'date'
    const sortDir = searchParams.get('sortDir') ?? 'desc'
    const isExport = searchParams.get('export') === 'true'

    const userId = new Types.ObjectId(session.user.id)

    // Build filter
    const filter: Record<string, unknown> = { userId }
    if (type) filter.type = type
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId)
    if (status) filter.status = status
    if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) }
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate)
      if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate)
    }
    if (search) {
      filter.description = { $regex: search, $options: 'i' }
    }

    const sortField = ['date', 'amount', 'description'].includes(sortBy) ? sortBy : 'date'
    const sortOrder: 1 | -1 = sortDir === 'asc' ? 1 : -1
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder }

    if (isExport) {
      const transactions = await Transaction.find(filter)
        .sort(sort)
        .populate('categoryId', 'name icon color')
        .lean()

      const rows = transactions.map((t) => {
        const cat = t.categoryId as unknown as { name: string }
        return [
          new Date(t.date).toISOString().split('T')[0],
          t.description,
          cat?.name ?? '',
          t.type,
          t.amount.toFixed(2),
          t.status,
          (t.tags ?? []).join(';'),
          t.note ?? '',
        ].join(',')
      })

      const csv = [
        'date,description,category,type,amount,status,tags,note',
        ...rows,
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=transactions.csv',
        },
      })
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categoryId', 'name icon color group')
        .lean(),
      Transaction.countDocuments(filter),
    ])

    // Summary totals for current filter
    const summaryAgg = await Transaction.aggregate([
      { $match: { ...filter, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ])
    const summaryMap = Object.fromEntries(summaryAgg.map((s) => [s._id, s.total]))

    return NextResponse.json({
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalIncome: summaryMap['income'] ?? 0,
        totalExpenses: summaryMap['expense'] ?? 0,
      },
    })
  } catch (err) {
    console.error('[transactions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = TransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    await connectDB()

    const category = await Category.findOne({
      _id: parsed.data.categoryId,
      $or: [{ userId: session.user.id }, { isDefault: true }],
    })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const transaction = await Transaction.create({
      ...parsed.data,
      userId: new Types.ObjectId(session.user.id),
    })

    const populated = await transaction.populate('categoryId', 'name icon color group')
    return NextResponse.json({ data: populated }, { status: 201 })
  } catch (err) {
    console.error('[transactions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
