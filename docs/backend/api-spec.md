# API Specification

All routes require authentication except `/api/auth/*`. Auth is via NextAuth JWT cookie.

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, seed categories |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (login, logout, session) |

## Transactions

| Method | Path | Description |
|---|---|---|
| GET | `/api/transactions` | List (paginated, filtered) |
| POST | `/api/transactions` | Create |
| GET | `/api/transactions/:id` | Single |
| PATCH | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

**GET query params:** `page`, `limit`, `type`, `categoryId`, `startDate`, `endDate`, `search`, `tags`, `status`, `sortBy`, `sortDir`, `export`

**Response shape:**
```json
{
  "data": [...],
  "total": 142,
  "page": 1,
  "limit": 20,
  "summary": { "totalIncome": 4500, "totalExpenses": 2800 }
}
```

## Budgets

| Method | Path | Description |
|---|---|---|
| GET | `/api/budgets` | List with live `spentAmount` |
| POST | `/api/budgets` | Create |
| PATCH | `/api/budgets/:id` | Update |
| DELETE | `/api/budgets/:id` | Delete |
| GET | `/api/budgets/alerts` | Budgets exceeding alertThreshold |

## Categories

| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | All (system + user custom) |
| POST | `/api/categories` | Create custom |
| PATCH | `/api/categories/:id` | Update custom |
| DELETE | `/api/categories/:id` | Delete custom (not system) |

## Analytics

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/api/analytics/summary` | `startDate`, `endDate` | IAnalyticsSummary |
| GET | `/api/analytics/trends` | `period` (3m\|6m\|12m) | Monthly income/expense arrays |
| GET | `/api/analytics/categories` | `startDate`, `endDate`, `type` | Spending by category |
| GET | `/api/analytics/heatmap` | `year` | Daily totals for year |

## Import

| Method | Path | Description |
|---|---|---|
| POST | `/api/import/csv` | Upload CSV, return preview |
| POST | `/api/import/confirm` | Bulk insert confirmed rows |
