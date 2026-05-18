'use client'

import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/Card'
import { TransactionForm } from '@/components/transactions/TransactionForm'

export default function NewTransactionPage() {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Card>
        <div className="px-6 pt-6 pb-2">
          <CardTitle className="text-xl">New Transaction</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record a new income, expense, or transfer.
          </p>
        </div>
        <TransactionForm
          onSuccess={() => router.push('/transactions')}
          onCancel={() => router.back()}
        />
      </Card>
    </div>
  )
}
