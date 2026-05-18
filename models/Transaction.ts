import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import type { TransactionType, TransactionStatus, RecurringInterval } from '@/types'

export interface ITransactionDocument extends Document {
  userId: Types.ObjectId
  type: TransactionType
  amount: number
  currency: string
  description: string
  categoryId: Types.ObjectId
  date: Date
  status: TransactionStatus
  tags: string[]
  note?: string
  isRecurring: boolean
  recurringInterval: RecurringInterval
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense', 'transfer'],
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    description: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      default: 'cleared',
      enum: ['cleared', 'pending', 'reconciled'],
    },
    tags: { type: [String], default: [] },
    note: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', null],
      default: null,
    },
  },
  { timestamps: true }
)

// Primary query patterns
TransactionSchema.index({ userId: 1, date: -1 })
TransactionSchema.index({ userId: 1, categoryId: 1 })
TransactionSchema.index({ userId: 1, type: 1, date: -1 })

const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction ??
  mongoose.model<ITransactionDocument>('Transaction', TransactionSchema)

export default Transaction
