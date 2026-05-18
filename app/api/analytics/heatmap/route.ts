import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { buildHeatmapPipeline, fillHeatmapGaps } from '@/lib/analytics'
import Transaction from '@/models/Transaction'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

    const raw = await Transaction.aggregate(buildHeatmapPipeline(session.user.id, year))

    const normalized = (raw as Array<{ _id: { year: number; month: number; day: number }; total: number; count: number }>).map((r) => ({
      date: format(new Date(r._id.year, r._id.month - 1, r._id.day), 'yyyy-MM-dd'),
      total: r.total,
      count: r.count,
    }))

    const filled = fillHeatmapGaps(normalized, year)
    const maxTotal = Math.max(...filled.map((d) => d.total), 1)

    return NextResponse.json({ data: filled, maxTotal, year })
  } catch (err) {
    console.error('[analytics heatmap]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
