import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { subDays, subMonths, startOfMonth, addDays } from 'date-fns'

// ─── Minimal inline models for seed (avoids Next.js import issues) ─────────────

const UserSchema = new mongoose.Schema({ name: String, email: String, passwordHash: String, currency: String, monthlyIncomeGoal: Number }, { timestamps: true })
const CategorySchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, name: String, group: String, icon: String, color: String, isDefault: Boolean })
const TransactionSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, type: String, amount: Number, currency: String, description: String, categoryId: mongoose.Schema.Types.ObjectId, date: Date, status: String, tags: [String], note: String, isRecurring: Boolean, recurringInterval: String }, { timestamps: true })
const BudgetSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, categoryId: mongoose.Schema.Types.ObjectId, name: String, limit: Number, period: String, startDate: Date, endDate: Date, alertThreshold: Number }, { timestamps: true })

const User = mongoose.models.User ?? mongoose.model('User', UserSchema)
const Category = mongoose.models.Category ?? mongoose.model('Category', CategorySchema)
const Transaction = mongoose.models.Transaction ?? mongoose.model('Transaction', TransactionSchema)
const Budget = mongoose.models.Budget ?? mongoose.model('Budget', BudgetSchema)

// ─── System Categories ────────────────────────────────────────────────────────

const SYSTEM_CATEGORIES = [
  { name: 'Housing', group: 'housing', icon: '🏠', color: '#6366f1', isDefault: true },
  { name: 'Food & Dining', group: 'food', icon: '🍔', color: '#10b981', isDefault: true },
  { name: 'Transport', group: 'transport', icon: '🚗', color: '#f59e0b', isDefault: true },
  { name: 'Health', group: 'health', icon: '💊', color: '#ec4899', isDefault: true },
  { name: 'Entertainment', group: 'entertainment', icon: '🎬', color: '#8b5cf6', isDefault: true },
  { name: 'Shopping', group: 'shopping', icon: '🛍', color: '#f43f5e', isDefault: true },
  { name: 'Savings', group: 'savings', icon: '💰', color: '#3b82f6', isDefault: true },
  { name: 'Income', group: 'income', icon: '💵', color: '#10b981', isDefault: true },
  { name: 'Utilities', group: 'utilities', icon: '⚡', color: '#64748b', isDefault: true },
  { name: 'Education', group: 'education', icon: '📚', color: '#06b6d4', isDefault: true },
  { name: 'Travel', group: 'travel', icon: '✈️', color: '#f97316', isDefault: true },
  { name: 'Pets', group: 'pets', icon: '🐾', color: '#84cc16', isDefault: true },
  { name: 'Insurance', group: 'insurance', icon: '🛡', color: '#6366f1', isDefault: true },
  { name: 'Subscriptions', group: 'subscriptions', icon: '📱', color: '#a855f7', isDefault: true },
  { name: 'Other', group: 'other', icon: '💡', color: '#94a3b8', isDefault: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysAgo: number): Date {
  return subDays(new Date(), Math.floor(Math.random() * daysAgo))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wealthlens'
  console.log(`🔌 Connecting to ${uri}...`)
  await mongoose.connect(uri)
  console.log('✅ Connected')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
  ])
  console.log('🗑  Cleared existing data')

  // 1. System categories (userId: null)
  const sysCats = await Category.insertMany(
    SYSTEM_CATEGORIES.map((c) => ({ ...c, userId: null }))
  )
  console.log(`📂 Seeded ${sysCats.length} system categories`)

  const catMap = new Map(sysCats.map((c) => [c.name, c._id]))

  // 2. Demo user
  const passwordHash = await bcrypt.hash('demo1234', 12)
  const user = await User.create({
    name: 'Alex Demo',
    email: 'demo@wealthlens.com',
    passwordHash,
    currency: 'USD',
    monthlyIncomeGoal: 5000,
  })
  console.log(`👤 Seeded demo user: demo@wealthlens.com / demo1234`)

  // Clone system categories for user — capture the new IDs
  const userCats = await Category.insertMany(
    SYSTEM_CATEGORIES.map((c) => ({ ...c, userId: user._id, isDefault: false }))
  )
  // Map category name → user-owned category ID (used for transactions + budgets)
  const userCatMap = new Map(userCats.map((c) => [c.name, c._id]))
  console.log(`📂 Cloned ${userCats.length} categories for demo user`)

  // 3. Transactions (200, spread across 12 months)
  const expenseDescriptions: Record<string, string[]> = {
    'Food & Dining': ['Grocery store', 'Pizza delivery', 'Coffee shop', 'Restaurant dinner', 'Lunch takeout', 'Bakery'],
    Transport: ['Uber ride', 'Gas station', 'Monthly bus pass', 'Car maintenance', 'Parking fee', 'Toll charges'],
    Housing: ['Monthly rent', 'Electricity bill', 'Internet bill', 'Home insurance', 'Maintenance fee'],
    Entertainment: ['Netflix subscription', 'Cinema tickets', 'Concert tickets', 'Video game', 'Streaming service'],
    Shopping: ['Amazon purchase', 'Clothing store', 'Electronics', 'Home decor', 'Sports equipment'],
    Health: ['Pharmacy', 'Doctor visit', 'Gym membership', 'Dental checkup', 'Health supplement'],
    Utilities: ['Water bill', 'Gas bill', 'Phone bill', 'Cloud storage'],
    Education: ['Online course', 'Textbooks', 'Workshop fee'],
    Travel: ['Hotel stay', 'Airfare', 'Travel insurance'],
    Pets: ['Pet food', 'Vet visit', 'Pet toys'],
    Insurance: ['Car insurance', 'Health insurance premium'],
    Subscriptions: ['Spotify', 'Adobe CC', 'GitHub Pro'],
  }

  const incomeDescriptions = [
    'Salary deposit', 'Freelance payment', 'Consulting fee',
    'Dividend income', 'Side project payment', 'Bonus payment',
    'Rental income', 'Investment return',
  ]

  const tags = ['essential', 'discretionary', 'recurring', 'one-time', 'business', 'personal']

  const expenseCatNames = Object.keys(expenseDescriptions)
  const transactions: object[] = []

  for (let i = 0; i < 200; i++) {
    const isIncome = Math.random() < 0.22
    const daysAgo = Math.floor(Math.random() * 365)
    const date = subDays(new Date(), daysAgo)

    if (isIncome) {
      const incomeId = userCatMap.get('Income')
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: rand(1500, 6000),
        currency: 'USD',
        description: pick(incomeDescriptions),
        categoryId: incomeId,
        date,
        status: pick(['cleared', 'cleared', 'cleared', 'pending']),
        tags: Math.random() > 0.6 ? [pick(tags)] : [],
        isRecurring: Math.random() < 0.3,
        recurringInterval: Math.random() < 0.3 ? 'monthly' : null,
      })
    } else {
      const catName = pick(expenseCatNames)
      const catId = userCatMap.get(catName)
      const descs = expenseDescriptions[catName]
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: rand(5, 400),
        currency: 'USD',
        description: pick(descs),
        categoryId: catId,
        date,
        status: pick(['cleared', 'cleared', 'pending', 'reconciled']),
        tags: Math.random() > 0.6 ? [pick(tags)] : [],
        note: Math.random() > 0.8 ? 'Monthly expense' : undefined,
        isRecurring: Math.random() < 0.15,
        recurringInterval: Math.random() < 0.15 ? pick(['monthly', 'weekly']) : null,
      })
    }
  }

  await Transaction.insertMany(transactions)
  console.log(`💳 Seeded ${transactions.length} transactions`)

  // 4. Budgets (8)
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = addDays(monthStart, 30)

  const budgetDefs = [
    { cat: 'Food & Dining', name: 'Food Budget', limit: 600, alertThreshold: 80 },
    { cat: 'Transport', name: 'Transport Budget', limit: 300, alertThreshold: 75 },
    { cat: 'Entertainment', name: 'Entertainment Budget', limit: 200, alertThreshold: 85 },
    { cat: 'Shopping', name: 'Shopping Budget', limit: 400, alertThreshold: 70 },
    { cat: 'Health', name: 'Health Budget', limit: 200, alertThreshold: 90 },
    { cat: 'Utilities', name: 'Utilities Budget', limit: 150, alertThreshold: 80 },
    { cat: 'Subscriptions', name: 'Subscriptions Budget', limit: 100, alertThreshold: 90 },
    { cat: 'Travel', name: 'Travel Fund', limit: 1000, alertThreshold: 70 },
  ]

  await Budget.insertMany(
    budgetDefs.map(({ cat, name, limit, alertThreshold }) => ({
      userId: user._id,
      categoryId: userCatMap.get(cat),
      name,
      limit,
      period: 'monthly',
      startDate: monthStart,
      endDate: monthEnd,
      alertThreshold,
    }))
  )
  console.log(`📊 Seeded ${budgetDefs.length} budgets`)

  await mongoose.disconnect()
  console.log('🎉 Seed complete! Login with: demo@wealthlens.com / demo1234')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
