# Database Schema

## Collections

### users
```
_id         ObjectId
name        String
email       String (unique)
passwordHash String
currency    String (default: 'USD')
monthlyIncomeGoal Number
createdAt   Date
updatedAt   Date
```

### transactions
```
_id               ObjectId
userId            ObjectId → users
type              'income' | 'expense' | 'transfer'
amount            Number
currency          String
description       String
categoryId        ObjectId → categories
date              Date
status            'cleared' | 'pending' | 'reconciled'
tags              [String]
note              String?
isRecurring       Boolean
recurringInterval 'daily' | 'weekly' | 'monthly' | null
createdAt         Date
updatedAt         Date

Indexes:
  { userId: 1, date: -1 }     (primary query pattern)
  { userId: 1, categoryId: 1 } (analytics joins)
```

### budgets
```
_id            ObjectId
userId         ObjectId → users
categoryId     ObjectId → categories
name           String
limit          Number
period         'weekly' | 'monthly' | 'yearly'
startDate      Date
endDate        Date
alertThreshold Number (percentage, e.g. 80)
createdAt      Date
updatedAt      Date

Virtuals (computed at read time via aggregation):
  spentAmount     — sum of expense transactions in current period
  remainingAmount — limit - spentAmount
  percentageUsed  — (spentAmount / limit) * 100
```

### categories
```
_id       ObjectId
userId    ObjectId | null  (null = system default)
name      String
group     CategoryGroup
icon      String (emoji)
color     String (hex, e.g. '#6366f1')
isDefault Boolean
```

## Seed Data

- 15 system categories (userId: null, isDefault: true)
- 1 demo user (demo@wealthlens.com / demo1234)
- 200 transactions over last 12 months
- 8 budgets with varied alertThreshold values
