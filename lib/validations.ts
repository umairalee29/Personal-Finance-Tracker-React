import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    currency: z.string().default('USD'),
    monthlyIncomeGoal: z.coerce.number().min(0).default(0),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  currency: z.string().optional(),
  monthlyIncomeGoal: z.coerce.number().min(0).optional(),
})

// ─── Transactions ─────────────────────────────────────────────────────────────

export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  description: z.string().min(1, 'Description is required').max(200),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.coerce.date(),
  status: z.enum(['cleared', 'pending', 'reconciled']).default('cleared'),
  tags: z.array(z.string()).default([]),
  note: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z
    .enum(['daily', 'weekly', 'monthly'])
    .nullable()
    .default(null),
})

export const TransactionUpdateSchema = TransactionSchema.partial()

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const BudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(100),
  limit: z.coerce.number().positive('Limit must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  alertThreshold: z.coerce
    .number()
    .min(50)
    .max(100)
    .default(80),
})

export const BudgetUpdateSchema = BudgetSchema.partial()

// ─── Categories ───────────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  group: z.enum([
    'housing',
    'food',
    'transport',
    'health',
    'entertainment',
    'shopping',
    'savings',
    'income',
    'utilities',
    'education',
    'travel',
    'pets',
    'insurance',
    'subscriptions',
    'other',
  ]),
  icon: z.string().min(1, 'Icon is required'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code'),
})

export const CategoryUpdateSchema = CategorySchema.partial()

// ─── CSV Import ───────────────────────────────────────────────────────────────

export const CSVMappingSchema = z.object({
  date: z.string().min(1, 'Date column is required'),
  description: z.string().min(1, 'Description column is required'),
  amount: z.string().min(1, 'Amount column is required'),
  type: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
  note: z.string().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type TransactionInput = z.infer<typeof TransactionSchema>
export type BudgetInput = z.infer<typeof BudgetSchema>
export type CategoryInput = z.infer<typeof CategorySchema>
export type CSVMappingInput = z.infer<typeof CSVMappingSchema>
