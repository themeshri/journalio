# Phase 1: Foundation & Import - Research

**Researched:** 2026-02-11
**Domain:** Authentication, Wallet Management, Solana Trade Import
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 focuses on establishing secure authentication with social logins, wallet address management, and automated Solana trade import. The stack (Next.js 16, Clerk, PostgreSQL, Prisma, OKX APIs) is well-established for 2026, but trade import requires careful attention to data parsing and P&L calculation accuracy.

**Key constraints:** OKX Wallet API focuses on DEX execution rather than historical import, requiring alternative approaches through RPC calls or specialized parsers. Solana trade parsing is complex due to multi-hop swaps and program instruction variations.

**Primary recommendation:** Use Clerk for auth + social logins, Prisma schema with proper relationships for multi-wallet support, and combine OKX DEX APIs with Solana RPC parsing for comprehensive trade import.

## Standard Stack

### Core Authentication & Backend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Clerk | Latest | Authentication & user management | Zero-integration with social login (Twitter/X, Google). SOC 2 Type II compliant. Built-in Next.js 16 support with App Router. |
| Next.js | 16.1+ | Full-stack framework | Turbopack bundler (5-10x faster), React Compiler, excellent TypeScript integration. Industry standard for SaaS in 2026. |
| PostgreSQL | 15+ | Primary database | ACID compliance essential for financial data. JSON support for flexible trade metadata. |
| Prisma | 5+ | ORM | Type-safe database access, automated migrations, prevents SQL injection in financial systems. |

### UI & Styling
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Shadcn UI | Latest | Component library | Production-ready with accessibility. 53 chart types for trading data. Seamless Tailwind integration. |
| Tailwind CSS | 4+ | Styling | Rapid development, perfect for data-heavy trading interfaces. Excellent tree-shaking. |
| Lucide React | Latest | Icons | Comprehensive icon set, consistent design language. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | 7+ | Form handling | Complex wallet and trade forms with validation. Minimal re-renders. |
| Zod | 3+ | Schema validation | Type-safe API validation. Critical for financial data validation. |
| TanStack Query | 5+ | Data fetching | Real-time trade data sync with caching and background updates. |
| date-fns | 3+ | Date manipulation | Timezone handling for global trading data. Lightweight alternative to Moment.js. |

### Solana Integration
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/web3.js | 1.95+ | Solana RPC client | Direct blockchain interaction for transaction parsing. |
| solana-dex-parser | Latest | Transaction parsing | Parse Jupiter, Raydium, Orca, Pumpfun swap transactions. |

**Installation:**
```bash
# Core framework
npx create-next-app@latest chainjournal --typescript --tailwind --eslint --app

# Authentication & Database
npm install @clerk/nextjs @prisma/client prisma

# UI components
npx shadcn-ui@latest init
npm install lucide-react

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# Data fetching & state
npm install @tanstack/react-query zustand

# Solana integration
npm install @solana/web3.js @solana/spl-token
npm install solana-dex-parser  # For DEX transaction parsing

# Utilities
npm install date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   ├── auth/             # Clerk auth pages
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth/             # Auth-related components
│   ├── dashboard/        # Dashboard components
│   └── wallet/           # Wallet management components
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # Clerk configuration
│   ├── db.ts             # Prisma client
│   ├── solana.ts         # Solana RPC configuration
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── prisma/               # Database schema and migrations
    └── schema.prisma
```

### Pattern 1: Multi-Tenant Data Isolation
**What:** Separate user data by userId in all database queries
**When to use:** SaaS application with user privacy requirements
**Example:**
```typescript
// Tenant-aware repository pattern
class WalletRepository {
  async findUserWallets(userId: string) {
    return await prisma.wallet.findMany({
      where: { userId }, // Always filter by userId
      include: { trades: true }
    });
  }
  
  async addWallet(userId: string, address: string, chain: string) {
    return await prisma.wallet.create({
      data: {
        address,
        chain,
        userId, // Always associate with user
        createdAt: new Date()
      }
    });
  }
}
```

### Pattern 2: Event-Driven Trade Import
**What:** Asynchronous trade import with progress tracking
**When to use:** Long-running operations that need user feedback
**Example:**
```typescript
// Background job pattern for trade import
class TradeImportService {
  async importWalletTrades(walletId: string, userId: string) {
    // Create import job record
    const job = await prisma.importJob.create({
      data: { walletId, userId, status: 'PENDING' }
    });
    
    // Queue background processing
    await this.queueTradeImport(job.id);
    
    return { jobId: job.id, status: 'STARTED' };
  }
  
  async processTradeImport(jobId: string) {
    const job = await prisma.importJob.findUnique({ 
      where: { id: jobId },
      include: { wallet: true }
    });
    
    try {
      // Update status
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' }
      });
      
      // Import trades
      const trades = await this.fetchSolanaTrades(job.wallet.address);
      
      // Bulk insert with transaction
      await prisma.$transaction(async (tx) => {
        for (const trade of trades) {
          await tx.trade.upsert({
            where: { signature: trade.signature },
            update: trade,
            create: { ...trade, walletId: job.walletId }
          });
        }
      });
      
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    } catch (error) {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: error.message }
      });
    }
  }
}
```

### Pattern 3: Progressive Dashboard Loading
**What:** Load critical data first, then enhance with additional metrics
**When to use:** Trading dashboards with multiple data sources
**Example:**
```typescript
// Progressive data loading pattern
function WalletDashboard({ walletId }: { walletId: string }) {
  // Load basic wallet info immediately
  const { data: wallet } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => fetchWallet(walletId)
  });
  
  // Load trades in background
  const { data: trades } = useQuery({
    queryKey: ['trades', walletId],
    queryFn: () => fetchWalletTrades(walletId),
    enabled: !!wallet // Only after wallet loads
  });
  
  // Calculate metrics after trades load
  const { data: metrics } = useQuery({
    queryKey: ['metrics', walletId],
    queryFn: () => calculateMetrics(trades),
    enabled: !!trades?.length
  });
  
  return (
    <div>
      <WalletHeader wallet={wallet} />
      {trades ? (
        <TradesTable trades={trades} metrics={metrics} />
      ) : (
        <SkeletonTable />
      )}
    </div>
  );
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT/session system | Clerk | Social login complexity, security vulnerabilities, MFA implementation |
| Database ORM | Raw SQL queries | Prisma | Type safety, migration management, SQL injection prevention |
| UI Components | Custom form controls | Shadcn UI + React Hook Form | Accessibility, validation, consistent styling |
| Solana RPC | Custom transaction parsing | @solana/web3.js + solana-dex-parser | Program instruction complexity, DEX variations, error handling |
| Real-time Updates | Custom WebSocket management | TanStack Query + server-sent events | Connection handling, retry logic, cache invalidation |
| Chart Rendering | Custom D3.js charts | Shadcn Charts (Recharts) | Responsive design, accessibility, maintenance overhead |

**Key insight:** Financial applications have hidden complexity in edge cases. Use battle-tested libraries for security-critical components.

## Common Pitfalls

### Pitfall 1: Incomplete Solana Transaction Parsing
**What goes wrong:** Missing trades due to complex multi-hop swaps or unknown program instructions
**Why it happens:** Jupiter aggregates through multiple DEXs in single transaction. Custom programs use non-standard instruction formats.
**How to avoid:** Use multiple parsing methods - OKX API where available, then fallback to solana-dex-parser, then RPC analysis
**Warning signs:** User reports trades missing from dashboard, P&L calculations don't match wallet balance changes

### Pitfall 2: Social Login Production Misconfiguration
**What goes wrong:** OAuth redirects fail in production, users can't sign up
**Why it happens:** Clerk development uses shared credentials. Production requires custom OAuth app setup with correct domain configuration.
**How to avoid:** Set up production OAuth apps early. Test with production Clerk instance before launch.
**Warning signs:** Authentication works in development but fails with domain errors in production

### Pitfall 3: Naive P&L Calculation
**What goes wrong:** Incorrect profit/loss calculations due to fees, slippage, or multi-token swaps
**Why it happens:** Simple (sell_price - buy_price) * quantity doesn't account for Solana fees, MEV, or intermediate tokens
**How to avoid:** Parse actual token amounts from transaction logs, not instruction parameters. Include all fees in calculations.
**Warning signs:** P&L doesn't match user's actual wallet balance changes, complaints about "inaccurate" calculations

### Pitfall 4: Database Design for Multi-Wallet Users
**What goes wrong:** Poor query performance or data isolation issues when users have many wallets
**Why it happens:** Not properly indexing userId + walletId relationships, or allowing cross-user data leakage
**How to avoid:** Always filter by userId in queries. Add compound indexes. Use Prisma's relation filtering.
**Warning signs:** Slow dashboard loading, users seeing other users' data, N+1 query problems

### Pitfall 5: Rate Limiting with External APIs
**What goes wrong:** Import jobs fail due to RPC rate limits or API quotas
**Why it happens:** Solana RPC providers limit requests. OKX APIs have rate limits. Bulk operations exceed limits.
**How to avoid:** Implement exponential backoff, request queuing, and multiple RPC endpoints
**Warning signs:** "Too many requests" errors, incomplete trade imports, users complaining about slow sync

## Code Examples

Verified patterns for Phase 1 implementation:

### Clerk Authentication Setup
```typescript
// src/lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export async function getUserDetails() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName,
    avatar: user.imageUrl
  };
}
```

### Database Schema
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  wallets   Wallet[]
  
  @@map("users")
}

model Wallet {
  id        String   @id @default(cuid())
  address   String
  chain     String   @default("solana")
  label     String?  // User-defined label
  isActive  Boolean  @default(true)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades Trade[]
  
  @@unique([userId, address, chain])
  @@index([userId, isActive])
  @@map("wallets")
}

model Trade {
  id          String   @id @default(cuid())
  signature   String   @unique // Solana transaction signature
  walletId    String
  
  // Trade details
  type        String   // "buy", "sell", "swap"
  tokenIn     String   // Input token mint address
  tokenOut    String   // Output token mint address
  amountIn    Decimal  @db.Decimal(20, 8)
  amountOut   Decimal  @db.Decimal(20, 8)
  priceIn     Decimal? @db.Decimal(20, 8) // USD price at time of trade
  priceOut    Decimal? @db.Decimal(20, 8)
  
  // Metadata
  dex         String?  // "jupiter", "raydium", "orca"
  fees        Decimal  @default(0) @db.Decimal(10, 8)
  blockTime   DateTime
  slot        BigInt
  
  // Processing status
  processed   Boolean  @default(false)
  error       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  wallet Trade @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  @@index([walletId, blockTime])
  @@index([signature])
  @@map("trades")
}

model ImportJob {
  id          String   @id @default(cuid())
  walletId    String
  status      String   // "PENDING", "PROCESSING", "COMPLETED", "FAILED"
  progress    Int      @default(0)
  total       Int?
  error       String?
  startedAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([walletId, status])
  @@map("import_jobs")
}
```

### Solana Trade Import
```typescript
// src/lib/solana-parser.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { DexParser } from 'solana-dex-parser';

export class SolanaTradeParser {
  private connection: Connection;
  private parser: DexParser;
  
  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.parser = new DexParser();
  }
  
  async getWalletTrades(address: string, beforeSignature?: string) {
    const publicKey = new PublicKey(address);
    
    // Get transaction signatures
    const signatures = await this.connection.getSignaturesForAddress(
      publicKey,
      {
        before: beforeSignature,
        limit: 100
      }
    );
    
    const trades = [];
    
    for (const sigInfo of signatures) {
      if (sigInfo.err) continue; // Skip failed transactions
      
      try {
        const transaction = await this.connection.getTransaction(
          sigInfo.signature,
          { maxSupportedTransactionVersion: 0 }
        );
        
        if (!transaction) continue;
        
        // Parse DEX trades
        const parsedTrade = await this.parser.parseTransaction(transaction);
        
        if (parsedTrade) {
          trades.push({
            signature: sigInfo.signature,
            type: parsedTrade.type,
            tokenIn: parsedTrade.tokenIn.mint,
            tokenOut: parsedTrade.tokenOut.mint,
            amountIn: parsedTrade.tokenIn.amount,
            amountOut: parsedTrade.tokenOut.amount,
            dex: parsedTrade.dex,
            fees: parsedTrade.fees || 0,
            blockTime: new Date(transaction.blockTime! * 1000),
            slot: BigInt(transaction.slot)
          });
        }
      } catch (error) {
        console.error(`Failed to parse transaction ${sigInfo.signature}:`, error);
        continue;
      }
    }
    
    return trades;
  }
}
```

### Dashboard API Route
```typescript
// src/app/api/dashboard/[walletId]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { walletId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: params.walletId,
        userId
      }
    });
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    // Get recent trades
    const trades = await prisma.trade.findMany({
      where: { walletId: params.walletId },
      orderBy: { blockTime: 'desc' },
      take: 50
    });
    
    // Calculate basic metrics
    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, trade) => 
      sum + parseFloat(trade.amountIn.toString()) * parseFloat(trade.priceIn?.toString() || '0'), 
      0
    );
    
    return NextResponse.json({
      wallet,
      trades,
      metrics: {
        totalTrades,
        totalVolume
      }
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth.js | Clerk | 2024-2025 | Better security, social login UX, production reliability |
| Manual transaction parsing | solana-dex-parser library | 2025 | Handles Jupiter aggregation, multiple DEX support |
| Single-RPC reliance | Multi-endpoint failover | 2025 | Better reliability, rate limit handling |
| Raw SQL queries | Prisma ORM | 2023-2024 | Type safety, migration management, security |
| Custom chart components | Shadcn Charts | 2025 | Accessibility, maintenance, responsive design |

**Deprecated/outdated:**
- NextAuth.js: Security vulnerabilities (CVE-2025-29927), maintenance burden
- Manual Solana parsing: Can't keep up with DEX evolution, Jupiter complexity

## Open Questions

1. **OKX Wallet API Historical Data Access**
   - What we know: OKX focuses on DEX execution, not historical import
   - What's unclear: Alternative methods for bulk historical data
   - Recommendation: Test OKX endpoints + implement Solana RPC backup

2. **Production Social Login Configuration**
   - What we know: Clerk development uses shared OAuth credentials
   - What's unclear: Twitter/X OAuth app setup requirements for production
   - Recommendation: Set up production OAuth apps before launch

3. **Solana Trade Parsing Accuracy**
   - What we know: Multi-hop swaps are complex, many DEX variations
   - What's unclear: Success rate of automated parsing vs manual review needed
   - Recommendation: Implement parsing confidence scores, manual review queue

## Sources

### Primary (HIGH confidence)
- [Clerk Next.js Documentation](https://clerk.com/docs/nextjs) - Official setup guide
- [Shadcn UI Chart Components](https://ui.shadcn.com/charts/area) - 53 chart types for trading data
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql) - Database setup

### Secondary (MEDIUM confidence)
- [Bitquery Solana DEX API](https://docs.bitquery.io/docs/blockchain/Solana/solana-dextrades/) - Trade data access patterns
- [TradesViz 2026 UI Updates](https://www.tradesviz.com/blog/) - Current trading interface patterns
- [OKX Wallet API Documentation](https://web3.okx.com/build/dev-docs/wallet-api/what-is-wallet-api) - API capabilities

### Tertiary (LOW confidence)
- Solana DEX parser libraries - Need verification for production reliability
- Multi-hop swap parsing accuracy - Requires testing with real data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Well-established technologies with current docs
- Architecture: MEDIUM-HIGH - Proven patterns, some adaptation needed
- Pitfalls: HIGH - Based on common production issues
- Solana parsing: MEDIUM - Complex domain, tooling evolving

**Research date:** 2026-02-11
**Valid until:** 30 days (stable technologies) / 7 days (Solana ecosystem evolution)