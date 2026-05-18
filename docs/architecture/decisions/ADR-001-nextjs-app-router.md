# ADR-001: Next.js 14 App Router

**Status:** Accepted

## Decision

Use Next.js 14 with the App Router for both frontend and backend.

## Rationale

- Single deployment unit — no separate API server
- Server Components reduce client JS for data-heavy pages
- API Routes give full REST flexibility without a separate Express app
- Excellent TypeScript support out of the box

## Trade-offs

- App Router is newer; some third-party libraries (NextAuth v5) still in beta
- Server/client component boundary requires care (no hooks in Server Components)
