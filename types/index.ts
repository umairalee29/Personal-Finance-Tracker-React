// ─── Primitive Enums ──────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer'

export type TransactionStatus = 'cleared' | 'pending' | 'reconciled'

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'

export type CategoryGroup =
  | 'housing'
  | 'food'
  | 'transport'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'savings'
  | 'income'
  | 'utilities'
  | 'education'
  | 'travel'
  | 'pets'
  | 'insurance'
  | 'subscriptions'
  | 'other'

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | null

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface IUser {
  id: string
  name: string
  email: string
  passwordHash: string
  currency: string
  monthlyIncomeGoal: number
  createdAt: Date
  updatedAt: Date
}

export interface ICategory {
  _id?: string
  id: string
  userId: string | null
  name: string
  group: CategoryGroup
  icon: string
  color: string
  isDefault: boolean
}

export interface ITransaction {
  _id?: string
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  description: string
  categoryId: string
  category?: ICategory
  date: Date
  status: TransactionStatus
  tags: string[]
  note?: string
  isRecurring: boolean
  recurringInterval: RecurringInterval
  createdAt: Date
  updatedAt: Date
}

export interface IBudget {
  _id?: string
  id: string
  userId: string
  categoryId: string
  category?: ICategory
  name: string
  limit: number
  period: BudgetPeriod
  startDate: Date
  endDate: Date
  alertThreshold: number
  spentAmount?: number
  remainingAmount?: number
  percentageUsed?: number
  createdAt: Date
  updatedAt: Date
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ITopCategory {
  category: string
  categoryId: string
  icon: string
  color: string
  amount: number
  percentage: number
}

export interface IAnalyticsSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  topCategories: ITopCategory[]
  expenseChangePercent: number
  previousMonthExpenses: number
  incomeChangePercent: number
  previousMonthIncome: number
}

export interface IMonthlyTrend {
  month: string
  income: number
  expenses: number
  netSavings: number
}

export interface ICategoryBreakdown {
  categoryId: string
  category: string
  icon: string
  color: string
  total: number
  percentage: number
  avgPerMonth: number
  transactionCount: number
}

export interface IHeatmapDay {
  date: string
  total: number
  count: number
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface IPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary?: {
    totalIncome: number
    totalExpenses: number
  }
}

export interface IApiError {
  error: string
  details?: Record<string, string[]>
}

// ─── Filter / Query Types ─────────────────────────────────────────────────────

export interface TransactionFilters {
  page: number
  limit: number
  type?: TransactionType
  categoryId?: string
  startDate?: string
  endDate?: string
  search?: string
  tags?: string[]
  status?: TransactionStatus
  sortBy?: 'date' | 'amount' | 'description'
  sortDir?: 'asc' | 'desc'
}

// ─── CSV Import ────────────────────────────────────────────────────────────────

export interface CSVColumnMapping {
  date: string
  description: string
  amount: string
  type?: string
  category?: string
  status?: string
  tags?: string
  note?: string
}

export interface CSVPreviewRow {
  index: number
  raw: Record<string, string>
  mapped: Partial<ITransaction>
  include: boolean
  errors?: string[]
}

// ─── NextAuth Session Augmentation ───────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      currency: string
      monthlyIncomeGoal: number
    }
  }

  interface User {
    id: string
    name: string
    email: string
    currency: string
    monthlyIncomeGoal: number
  }
}

// JWT augmentation is handled in lib/auth.ts to avoid import resolution issues
