import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parse error', details: result.errors }, { status: 400 })
    }

    const headers = result.meta.fields ?? []
    const preview = result.data.slice(0, 5)
    const total = result.data.length

    return NextResponse.json({ headers, preview, total, rawData: result.data })
  } catch (err) {
    console.error('[import csv]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
