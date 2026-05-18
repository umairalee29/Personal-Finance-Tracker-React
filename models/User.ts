import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  currency: string
  monthlyIncomeGoal: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    currency: { type: String, default: 'USD' },
    monthlyIncomeGoal: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema)

export default User
