# ChainJournal — Optimization Roadmap

> Based on a full audit of the codebase: 67 commits, ~20,700 lines of TypeScript, 13 Prisma models, 20+ API routes, and complete git history review.

---

## 🚨 Phase 0: Critical Fixes (Do First — Day 1)

These are bugs and security holes that will break things in production. Non-negotiable.

### 0.1 — Leaked Secrets in Git History

**Severity: CRITICAL**

Your git history contains real Clerk API keys that were committed and then "removed":

```
pk_test_cHJlY2lzZS1zdGF0aWMtNjUuY2xlcmsuYWNjb3VudHMuZGV2JA
sk_test_26nBJYYS8nwNz4x4XQGXJGtlnlkwZ7F2OGnv0ZlCgp
```

Also exposed: `DATABASE_URL` with your local Postgres username (`husammeshri`), a `CRON_SECRET`, and OKX API placeholder keys. Even though the `.env.local` file was deleted in a later commit, **anyone can view these in the git history**.

**Fix:**
1. Immediately rotate the Clerk keys in the Clerk dashboard
2. Change your Postgres password
3. Either rewrite git history with `git filter-repo` or (simpler) create a fresh repo from the current state:
   ```bash
   cp -r journalio journalio-clean
   cd journalio-clean
   rm -rf .git
   git init && git add . && git commit -m "initial commit"
   ```
4. Add a proper `.env.example` with placeholder values only

### 0.2 — Schema vs. API Mismatch (App Will Crash)

**Severity: CRITICAL**

The `Trade` model in Prisma has **no `userId` field** — it relates to users through `Wallet.userId`. But the `GET /api/trades` route queries `prisma.trade.findMany({ where: { userId: session.userId } })` and tries to create trades with `userId` directly. This will throw a Prisma error on any real database.

**Fix:** Either add `userId` to the Trade model, or change all trade queries to go through wallet relations:
```typescript
// Correct approach — query through wallet
const trades = await prisma.trade.findMany({
  where: { wallet: { userId: session.userId } },
  include: { wallet: true, mistakes: true }
});
```

### 0.3 — Triple Prisma Client Instantiation

**Severity: HIGH**

You have 3 separate Prisma client setups:
- `src/lib/db.ts` — singleton via `globalThis`
- `src/lib/prisma.ts` — singleton via `global`
- `src/app/api/trades/manual/route.ts` — raw `new PrismaClient()` on every request

The manual route creates a **new database connection pool on every API call**. This will exhaust your connection limit fast.

**Fix:** Delete `src/lib/prisma.ts`, keep only `src/lib/db.ts`, and update all imports:
```bash
# Fix the manual route
- import { PrismaClient } from '@prisma/client';
- const prisma = new PrismaClient();
+ import { prisma } from '@/lib/db';

# Fix journal routes
- import { prisma } from '@/lib/prisma';
+ import { prisma } from '@/lib/db';
```


---

## 🔧 Phase 1: Code Quality & Architecture (Week 1-2)

### 1.1 — Kill the Mock Data Layer

The app currently has two parallel realities:
- `/api/trades/simple` returns hardcoded JSON (the dashboard uses this)
- `/api/trades` tries to query the real database

This means the dashboard shows fake data even when real trades exist.

**Actions:**
- Delete `src/app/api/trades/simple/route.ts` entirely
- Move the seed data to `scripts/seed-trades.ts` (which already exists)
- Point the dashboard to `/api/trades`
- Delete the "auto-create example trades" block from `GET /api/trades` (200+ lines of inline mock data in an API route)
- Similarly, remove mock implementations from `supabase-storage.ts` and replace with real Supabase calls

### 1.2 — Break Up God Components

Several files are doing way too much:

| File | Lines | Problem |
|------|-------|---------|
| `trade-editor.tsx` | 868 | Form + audit log viewer + journal + validation all in one |
| `enhanced-trade-filters.tsx` | 855 | Filter UI + state management + query building |
| `analytics.ts` | 858 | 6+ different analytics calculations in one class |
| `position-tracker.ts` | 510 | Fine as-is, but needs unit tests |

**Refactoring plan:**
- `trade-editor.tsx` → `TradeForm`, `AuditLogViewer`, `TradeEditorContainer`
- `enhanced-trade-filters.tsx` → `FilterPanel`, `useTradeFilters` hook, `filterUtils.ts`
- `analytics.ts` → Split into `metrics-calculator.ts`, `pnl-calculator.ts`, `mistake-analytics.ts`, `position-analytics.ts`

### 1.3 — Standardize API Patterns

Current API routes are inconsistent:
- Some validate with Zod, others don't
- Some use `auth()`, others use `requireAuth()`, the manual route uses neither
- Error responses vary between `{ error: string }` and `{ error: string, details: any }`
- The `PUT /api/trades/manual` builds update objects with `any` type

**Create a shared API layer:**
```typescript
// lib/api-utils.ts
export function apiHandler(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const userId = await requireAuth();
      return await handler(req, userId);
    } catch (error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error(`API Error:`, error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
```

### 1.4 — Fix the P&L Calculation Bug

In `trade-calculator.ts`:
```typescript
const feesUSD = fees * 100; // Assuming SOL price around $100 for fees
```

This hardcodes SOL at $100. Every fee calculation is wrong whenever SOL isn't exactly $100. Use the actual `priceIn`/`priceOut` or fetch current price.

### 1.5 — Add the Missing `.env.example`

```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
BYPASS_AUTH=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chainjournal

# Solana
SOLANA_RPC_URL_PRIMARY=https://api.mainnet-beta.solana.com

# Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Cron
CRON_SECRET=generate-a-real-secret
```

---

## 🎨 Phase 2: UI/UX Improvements (Week 2-3)

### 2.1 — Dashboard Is Lying to Users

The dashboard currently shows:
- **Win Rate: 75%** — this is hardcoded, not calculated
- Total volume is calculated from mock data
- No actual P&L display

**Fix:** Connect dashboard metrics to the real `AnalyticsService`:
```typescript
// Use server component or SWR/React Query to fetch real metrics
const metrics = await analyticsService.calculateWalletMetrics(walletId);
```

### 2.2 — Add Loading & Empty States

Current loading state is just a spinner. No skeleton screens, no empty state messaging.

**Add:**
- Skeleton loaders for the trades table and dashboard cards
- Empty states with clear CTAs: "No trades yet — import from your wallet or add manually"
- Error boundaries with retry buttons (the `error.tsx` exists but is basic)

### 2.3 — Responsive Navigation Improvements

The sidebar is always visible. On mobile, it should collapse to a hamburger menu or bottom nav.

**Implement:**
- Collapsible sidebar with Zustand state
- Mobile-first bottom navigation for key actions (Dashboard, Trades, Journal, Analytics)
- Breadcrumb navigation for nested pages

### 2.4 — Trade Entry UX

The manual trade form (`manual-trade-form.tsx`, 616 lines) requires too many fields upfront. For Solana traders, the common flow is:
1. Paste a transaction signature
2. Auto-fill everything from on-chain data
3. Add notes/tags/rating

**Implement a two-step flow:**
- Step 1: Paste signature OR enter manually
- Step 2: Review auto-filled data, add journal notes
- Use the existing `SolanaTransactionParser` to auto-populate

### 2.5 — Journal Entry UX

The voice recorder and file upload work but feel disconnected. Unify them into a single "Add to Journal" panel:
- Inline voice recording with waveform visualization
- Drag-and-drop file zone
- Quick-tag chips
- Star rating as a single click row, not a dropdown

### 2.6 — Dark Mode

The README says "Dark Mode Ready" but there's no theme toggle. Tailwind is configured but no `dark:` variants are used.

**Add:**
- Theme toggle in header
- `next-themes` provider
- Apply `dark:` variants to all components (shadcn/ui supports this natively)

---

## 🔒 Phase 3: Security Hardening (Week 3-4)

### 3.1 — Input Validation on All API Routes

Several routes accept raw `body` without validation:
- `POST /api/trades` passes `body` directly to Prisma: `prisma.trade.create({ data: { ...body } })`
- This is a **mass assignment vulnerability** — an attacker can set any field including `walletId`, `source`, etc.

**Fix:** Add Zod schemas to every route. Never spread raw request body into Prisma.

### 3.2 — Authorization Checks (Not Just Authentication)

The manual trades route checks if a wallet exists but doesn't verify the wallet belongs to the authenticated user:
```typescript
const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
// ❌ Missing: && wallet.userId === session.userId
```

**Audit every route** for proper ownership checks. Pattern:
```typescript
const wallet = await prisma.wallet.findFirst({
  where: { id: data.walletId, userId: session.userId }
});
```

### 3.3 — Rate Limiting

The upload route has in-memory rate limiting, but it resets on server restart and doesn't work across multiple instances. Other routes have no rate limiting at all.

**Use Upstash Redis or Vercel KV** for distributed rate limiting:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});
```

### 3.4 — File Upload Security

Current validation checks MIME type but not file content. An attacker could upload a `.exe` renamed to `image/png`.

**Add:**
- Magic byte validation (check actual file headers, not just MIME)
- Virus scanning integration (ClamAV or a cloud service)
- Content Security Policy headers
- Serve uploaded files from a separate domain/CDN (never from your app domain)

### 3.5 — CORS & Security Headers

`next.config.js` only configures `serverActions.allowedOrigins`. Missing:
- CORS configuration for API routes
- Security headers (CSP, X-Frame-Options, etc.)

**Add to `next.config.js`:**
```javascript
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

### 3.6 — Cron Endpoint Protection

The daily sync cron uses `Bearer` token auth, which is fine, but the same endpoint is exposed as both GET and POST with no distinction. Add Vercel's `CRON_SECRET` header validation if deploying there.

---

## ⚡ Phase 4: Performance (Week 4-5)

### 4.1 — Database Query Optimization

The `GET /api/trades` route:
1. Finds wallet
2. If no wallet, creates one (with hardcoded address!)
3. Counts all trades
4. If zero, creates 20 example trades
5. Then fetches all trades with nested includes

This runs 3-5 queries minimum on every page load.

**Fix:**
- Remove auto-creation logic (use seed scripts)
- Add pagination (currently fetches ALL trades)
- Use `select` instead of `include` to avoid over-fetching:
  ```typescript
  const trades = await prisma.trade.findMany({
    where: { wallet: { userId } },
    select: { id: true, type: true, tokenIn: true, /* only what's needed */ },
    take: 25,
    skip: page * 25,
    orderBy: { blockTime: 'desc' }
  });
  ```

### 4.2 — Client-Side Data Fetching

The dashboard is a client component that fetches data in `useEffect`. This means:
1. Page loads empty
2. JavaScript runs
3. API call fires
4. Data renders

**Convert to server components** where possible:
```typescript
// app/dashboard/page.tsx — server component
export default async function Dashboard() {
  const userId = await requireAuth();
  const metrics = await analyticsService.getMetrics(userId);
  return <DashboardView metrics={metrics} />;
}
```

For interactive parts, use React Server Components with Suspense boundaries.

### 4.3 — Add React Query Properly

`@tanstack/react-query` is installed but not used anywhere. The app does raw `fetch` in `useEffect` without caching, deduplication, or retry logic.

**Implement:**
```typescript
// hooks/use-trades.ts
export function useTrades(filters: TradeFilter) {
  return useQuery({
    queryKey: ['trades', filters],
    queryFn: () => fetchTrades(filters),
    staleTime: 30_000,
  });
}
```

### 4.4 — Decimal Handling

Prisma returns `Decimal` objects that need `.toNumber()` conversion. This is done inconsistently — some routes convert, others don't. Financial data should use `Decimal.js` throughout, never floating point.

---

## 🧪 Phase 5: Testing & Reliability (Week 5-6)

### 5.1 — Add Vitest + Testing Library

Zero tests currently. Priority test targets:

1. **FIFO Position Tracker** — this is financial calculation code that must be correct
2. **Trade P&L calculations** — the fee bug proves this needs tests
3. **API route authorization** — ensure ownership checks work
4. **Zod validation schemas** — edge cases in trade input

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 5.2 — E2E Tests for Critical Flows

Use Playwright for:
- Sign up → add wallet → import trades → view dashboard
- Create manual trade → edit → delete
- Journal entry with voice note and file upload

### 5.3 — Type Safety

Several `any` types exist:
- `const where: any = {}` in manual trades route
- `const updateObject: any = {}` in trade update
- `originalData Json?` in schema (untyped JSON)

Replace with proper types or Zod-inferred types.

---

## 🚀 Phase 6: Production Readiness (Week 6-7)

### 6.1 — Real Storage Implementation

Replace the mock Supabase storage with actual implementation. The interface is already defined — just swap the mock functions.

### 6.2 — Error Monitoring

Add Sentry or similar:
```bash
npm install @sentry/nextjs
```

### 6.3 — Database Migrations

Set up proper migration workflow:
```bash
npx prisma migrate dev --name init
```

Currently there are no migration files, just the schema.

### 6.4 — CI/CD Pipeline

Add GitHub Actions:
- Lint + type-check on PR
- Run tests
- Preview deployments on Vercel
- Production deploy on merge to main

### 6.5 — Remove Build Artifacts from Repo

`tsconfig.tsbuildinfo` (376KB) is committed. Add to `.gitignore`.

---

## Priority Matrix

| Phase | Impact | Effort | Do When |
|-------|--------|--------|---------|
| **Phase 0** — Critical Fixes | 🔴 Blocking | Low | **Immediately** |
| **Phase 1** — Code Quality | 🟡 High | Medium | Week 1-2 |
| **Phase 2** — UI/UX | 🟡 High | Medium | Week 2-3 |
| **Phase 3** — Security | 🔴 Critical | Medium | Week 3-4 |
| **Phase 4** — Performance | 🟢 Medium | Low-Med | Week 4-5 |
| **Phase 5** — Testing | 🟡 High | High | Week 5-6 |
| **Phase 6** — Production | 🟡 High | Medium | Week 6-7 |

---

## Key Principle

The foundation (schema design, tech stack, feature vision) is strong. The gap is between "planned" and "wired up." Every phase above is about connecting what already exists into something that actually works end-to-end. Resist adding new features until Phases 0-3 are complete.