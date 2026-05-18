'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'

interface ImportCSVModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 1 | 2 | 3 | 4

const TRANSACTION_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'type', label: 'Type', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'note', label: 'Note', required: false },
]

export function ImportCSVModal({ open, onClose, onSuccess }: ImportCSVModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setStep(1)
    setHeaders([])
    setPreview([])
    setRawData([])
    setMapping({})
    setExcluded(new Set())
  }

  const handleClose = () => { reset(); onClose() }

  // Step 1: Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/import/csv', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { showToast.error(data.error ?? 'Upload failed'); return }
      setHeaders(data.headers)
      setPreview(data.preview)
      setRawData(data.rawData)
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Map raw rows
  const getMappedRows = () =>
    rawData.map((row) => {
      const mapped: Record<string, string> = {}
      Object.entries(mapping).forEach(([field, col]) => {
        if (col) mapped[field] = row[col] ?? ''
      })
      return mapped
    })

  // Step 4: Confirm
  const handleConfirm = async () => {
    setLoading(true)
    const rows = getMappedRows().filter((_, i) => !excluded.has(i))
    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) { showToast.error(data.error ?? 'Import failed'); return }
      showToast.success(`Imported ${data.count} transactions`)
      handleClose()
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ['Upload', 'Map Columns', 'Review', 'Confirm']

  return (
    <Modal open={open} onClose={handleClose} title="Import CSV" size="xl">
      <div className="p-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📤</div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Upload a CSV file to import transactions</p>
            <label className="btn-primary cursor-pointer">
              {loading ? 'Uploading...' : 'Choose CSV File'}
              <input type="file" accept=".csv" onChange={handleUpload} className="sr-only" disabled={loading} />
            </label>
            <p className="text-xs text-slate-400 mt-3">Supports comma-separated CSV files with a header row</p>
          </div>
        )}

        {/* Step 2: Column mapping */}
        {step === 2 && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Map your CSV columns to transaction fields:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TRANSACTION_FIELDS.map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label} {required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={mapping[key] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                    className="select text-xs"
                  >
                    <option value="">— Skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-4">Preview (first 5 rows):</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                      {headers.map((h) => <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1"
                disabled={!mapping['date'] || !mapping['description'] || !mapping['amount']}>
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {rawData.length - excluded.size} of {rawData.length} rows will be imported.
              Uncheck rows to exclude them.
            </p>
            <div className="overflow-y-auto max-h-72 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-2 py-2" />
                    {Object.keys(mapping).filter((k) => mapping[k]).map((k) => (
                      <th key={k} className="px-3 py-2 text-left text-slate-500 capitalize">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getMappedRows().map((row, i) => (
                    <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${excluded.has(i) ? 'opacity-40' : ''}`}>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={!excluded.has(i)}
                          onChange={(e) => {
                            const next = new Set(excluded)
                            if (e.target.checked) next.delete(i)
                            else next.add(i)
                            setExcluded(next)
                          }}
                        />
                      </td>
                      {Object.keys(mapping).filter((k) => mapping[k]).map((k) => (
                        <td key={k} className="px-3 py-2 text-slate-700 dark:text-slate-300">{row[k]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">Next: Confirm</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Ready to import {rawData.length - excluded.size} transactions
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              This will add the transactions to your account. This action cannot be undone.
            </p>
            <div className="flex gap-3 max-w-sm mx-auto">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
              <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
