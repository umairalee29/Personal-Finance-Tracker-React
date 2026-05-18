# WealthLens — Claude Code Guide

## Project Overview

WealthLens is a full-stack personal finance tracker built with Next.js 14 App Router. It lets users track income/expenses, set budgets, and visualise spending trends.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | MongoDB 7+ with Mongoose 8 |
| Auth | NextAuth.js v5 beta (JWT strategy) |
| Styling | Tailwind CSS 3 (dark mode via `class`) |
| Charts | Recharts 2 |
| Forms | React Hook Form + Zod |
| State | Zustand 5 |
| Date utils | date-fns 4 |
| CSV | PapaParse 5 |
| Toasts | react-hot-toast |

## Dev Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (must pass with zero TS errors)
npm run lint     # ESLint check
npm run seed     # Seed MongoDB with demo data
npx tsc --noEmit # Type-check only
```

## Project Structure

```
app/              Next.js App Router (pages + API routes)
  (auth)/         Unauthenticated pages (login, register)
  (app)/          Authenticated pages (dashboard, transactions, …)
  api/            API route handlers
components/       Shared React components
  ui/             Primitive UI building blocks
  charts/         Recharts wrappers
  transactions/   Transaction-specific components
  budgets/        Budget-specific components
  layout/         Sidebar, Topbar, MobileNav
lib/              Server-side utilities
  db.ts           Mongoose singleton connection
  auth.ts         NextAuth config
  validations.ts  Zod schemas (single source of truth)
  formatters.ts   Currency + date formatting
  analytics.ts    MongoDB aggregation pipeline builders
models/           Mongoose schemas
types/            TypeScript interfaces (index.ts)
hooks/            Client-side data fetching hooks
store/            Zustand global state
scripts/          CLI utilities (seed.ts)
docs/             SDLC documentation (architecture, API spec, etc.)
```

## TypeScript Rules

- Strict mode is on — no `any`, no implicit `undefined`
- All API route handlers must be typed with `NextRequest` / `NextResponse`
- Use the interfaces in `types/index.ts` — do not redeclare inline
- Prefer `interface` over `type` for object shapes

## API Auth Pattern

Every authenticated API route must start with:

```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
await connectDB()
```

## MongoDB Patterns

- Always import `connectDB` from `@/lib/db` before any model usage
- Use `{ userId: session.user.id }` filter on every query — never return cross-user data
- Compound indexes on Transaction: `{ userId: 1, date: -1 }` and `{ userId: 1, categoryId: 1 }`

## Dark Mode

- Strategy: `class` (Tailwind)
- The `<html>` element gets/loses the `dark` class via `Topbar`
- User preference is persisted in `localStorage` under key `wealthlens-theme`
- SSR flash prevention: inline `<script>` in root `layout.tsx` sets the class before paint

## Tailwind Color Aliases

```
primary  → indigo  (#6366f1)
income   → emerald (#10b981)
expense  → rose    (#f43f5e)
savings  → blue    (#3b82f6)
warning  → amber   (#f59e0b)
```

## Environment Variables

Copy `.env.example` → `.env.local` and fill in values. Never commit `.env.local`.

Required:
- `MONGODB_URI` — connection string
- `NEXTAUTH_SECRET` — random 32-byte base64 string
- `NEXTAUTH_URL` — full public URL of the app
