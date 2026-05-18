# Architecture Overview

## System Design

WealthLens is a monolithic Next.js 14 application using the App Router. All frontend and backend code lives in one repository; the backend is implemented as Next.js API Routes.

```
Browser
  │
  ▼
Next.js App Router (Vercel / Node.js)
  ├── /app/(auth)         Server-rendered auth pages
  ├── /app/(app)          Client-heavy finance pages
  └── /app/api            REST API handlers
          │
          ▼
       Mongoose ODM
          │
          ▼
       MongoDB (local dev / Atlas prod)
```

## Auth Flow

1. User submits credentials on `/login`
2. NextAuth `CredentialsProvider` calls `authorize()` in `lib/auth.ts`
3. `bcrypt.compare` validates password against stored hash
4. On success, NextAuth creates a signed JWT (stored in HttpOnly cookie)
5. JWT payload contains `{ id, email, name, currency }`
6. All API routes call `auth()` to verify and extract the session
7. User ID from the session is used as a filter on every DB query

## Data Flow (Transactions Page)

```
user opens /transactions
  → page.tsx mounts
  → useTransactions hook reads filters from Zustand store
  → fetch GET /api/transactions?page=1&limit=20&...
  → API route: auth() → connectDB() → Transaction.find({userId}) → paginate
  → JSON response: { data, total, page, limit, summary }
  → TransactionTable renders rows
  → user edits row → TransactionForm modal
  → POST/PATCH /api/transactions/[id]
  → optimistic update + toast
```

## Security Considerations

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with `NEXTAUTH_SECRET` (HS256)
- All DB queries scoped to `session.user.id` — no cross-user data leakage
- Input validated with Zod before any DB write
- No raw SQL / MongoDB injection possible via Mongoose typed queries
