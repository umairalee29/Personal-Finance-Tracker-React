import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import type { BudgetPeriod } from '@/types'

export interface IBudgetDocument extends Document {
  userId: Types.ObjectId
  categoryId: Types.ObjectId
  name: string
  limit: number
  period: BudgetPeriod
  startDate: Date
  endDate: Date
  alertThreshold: number
  createdAt: Date
  updatedAt: Date
}

const BudgetSchema = new Schema<IBudgetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      required: true,
      enum: ['weekly', 'monthly', 'yearly'],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
  },
  { timestamps: true }
)

BudgetSchema.index({ userId: 1 })
BudgetSchema.index({ userId: 1, categoryId: 1 })

const Budget: Model<IBudgetDocument> =
  mongoose.models.Budget ??
  mongoose.model<IBudgetDocument>('Budget', BudgetSchema)

export default Budget
