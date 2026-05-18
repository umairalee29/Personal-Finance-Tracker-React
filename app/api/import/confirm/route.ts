import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'
import Category from '@/models/Category'
import { Types } from 'mongoose'
import { parseAmount } from '@/lib/formatters'

interface ImportRow {
  date: string
  description: string
  amount: string
  type?: string
  categoryName?: string
  status?: string
  tags?: string
  note?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { rows }: { rows: ImportRow[] } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }

    await connectDB()

    const userId = new Types.ObjectId(session.user.id)

    // Load user categories for matching by name
    const categories = await Category.find({
      $or: [{ userId }, { isDefault: true }],
    }).lean()
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c._id]))
    const defaultCategoryId = categories[0]?._id

    const docs = rows
      .map((row) => {
        const amount = parseAmount(row.amount)
        if (!amount || !row.description || !row.date) return null

        const type = ['income', 'expense', 'transfer'].includes(row.type ?? '')
          ? (row.type as 'income' | 'expense' | 'transfer')
          : amount >= 0
          ? 'income'
          : 'expense'

        const catId = row.categoryName
          ? (catMap.get(row.categoryName.toLowerCase()) ?? defaultCategoryId)
          : defaultCategoryId

        return {
          userId,
          type,
          amount: Math.abs(amount),
          currency: session.user.currency ?? 'USD',
          description: row.description,
          categoryId: catId,
          date: new Date(row.date),
          status: ['cleared', 'pending', 'reconciled'].includes(row.status ?? '')
            ? row.status
            : 'cleared',
          tags: row.tags ? row.tags.split(';').map((t) => t.trim()).filter(Boolean) : [],
          note: row.note ?? undefined,
          isRecurring: false,
          recurringInterval: null,
        }
      })
      .filter(Boolean)

    if (docs.length === 0) {
      return NextResponse.json({ error: 'No valid rows to import' }, { status: 400 })
    }

    await Transaction.insertMany(docs)
    return NextResponse.json({ message: `Imported ${docs.length} transactions`, count: docs.length })
  } catch (err) {
    console.error('[import confirm]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
