import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import type { CategoryGroup } from '@/types'

export interface ICategoryDocument extends Document {
  userId: Types.ObjectId | null
  name: string
  group: CategoryGroup
  icon: string
  color: string
  isDefault: boolean
}

const CategorySchema = new Schema<ICategoryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  group: {
    type: String,
    required: true,
    enum: [
      'housing', 'food', 'transport', 'health', 'entertainment',
      'shopping', 'savings', 'income', 'utilities', 'education',
      'travel', 'pets', 'insurance', 'subscriptions', 'other',
    ],
  },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
})

CategorySchema.index({ userId: 1 })
CategorySchema.index({ isDefault: 1 })

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ??
  mongoose.model<ICategoryDocument>('Category', CategorySchema)

export default Category
