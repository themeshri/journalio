# Plan 01-02: Database & Wallet Management

**Phase:** 01-foundation  
**Plan:** 02  
**Requirements:** WALL-01, WALL-02, WALL-03, WALL-04, WALL-05  
**Depends on:** 01-01 (Authentication system must be working)

## Objective

Establish PostgreSQL database with Prisma ORM and implement comprehensive wallet management system. Users can add multiple Solana wallet addresses, view separate dashboards per wallet, combine data across wallets, and remove wallets from their account.

**Purpose:** Create secure multi-wallet data foundation with proper user isolation  
**Output:** Database schema and wallet management UI with full CRUD operations

## Tasks

### Task 1: Set Up PostgreSQL Database with Prisma

**Files created:**
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `.env.local` (updated)
- `prisma/migrations/` (generated)

**Action:**
Install PostgreSQL (or configure cloud database), set up Prisma ORM, and create the complete database schema for users, wallets, trades, and import jobs.

```bash
# Install Prisma and PostgreSQL driver
npm install prisma @prisma/client
npm install @types/node --save-dev

# Initialize Prisma
npx prisma init
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  label     String?
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
  signature   String   @unique
  walletId    String
  
  type        String
  tokenIn     String
  tokenOut    String
  amountIn    Decimal  @db.Decimal(20, 8)
  amountOut   Decimal  @db.Decimal(20, 8)
  priceIn     Decimal? @db.Decimal(20, 8)
  priceOut    Decimal? @db.Decimal(20, 8)
  
  dex         String?
  fees        Decimal  @default(0) @db.Decimal(10, 8)
  blockTime   DateTime
  slot        BigInt
  
  processed   Boolean  @default(false)
  error       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  wallet Wallet @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  @@index([walletId, blockTime])
  @@index([signature])
  @@map("trades")
}

model ImportJob {
  id          String   @id @default(cuid())
  walletId    String
  status      String
  progress    Int      @default(0)
  total       Int?
  error       String?
  startedAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([walletId, status])
  @@map("import_jobs")
}
```

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Update `.env.local` with database connection string and run initial migration.

**Verify:**
- `npx prisma db push` creates database tables successfully
- `npx prisma studio` opens database browser
- Database connection works in development
- All indexes and constraints are created

**Done:** PostgreSQL database configured with complete schema for multi-wallet trading data

### Task 2: Create Wallet Management API Routes

**Files created:**
- `src/app/api/wallets/route.ts`
- `src/app/api/wallets/[walletId]/route.ts`
- `src/lib/wallet-validation.ts`
- `src/types/wallet.ts`

**Action:**
Implement API endpoints for wallet CRUD operations with proper authentication, validation, and error handling. Ensure user isolation and Solana address validation.

```typescript
// src/types/wallet.ts
export interface Wallet {
  id: string;
  address: string;
  chain: string;
  label?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletRequest {
  address: string;
  label?: string;
  chain?: string;
}

export interface UpdateWalletRequest {
  label?: string;
  isActive?: boolean;
}
```

```typescript
// src/lib/wallet-validation.ts
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export const createWalletSchema = z.object({
  address: z.string().refine(isValidSolanaAddress, {
    message: "Invalid Solana wallet address"
  }),
  label: z.string().optional(),
  chain: z.string().default("solana")
});

export const updateWalletSchema = z.object({
  label: z.string().optional(),
  isActive: z.boolean().optional()
});
```

```typescript
// src/app/api/wallets/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createWalletSchema } from '@/lib/wallet-validation';
import { z } from 'zod';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error('Get wallets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWalletSchema.parse(body);

    // Check if wallet already exists for this user
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId_address_chain: {
          userId,
          address: validatedData.address,
          chain: validatedData.chain
        }
      }
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet address already added' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: {
        address: validatedData.address,
        chain: validatedData.chain,
        label: validatedData.label,
        userId
      }
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid wallet data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}
```

Implement individual wallet operations (GET, PUT, DELETE) in `[walletId]/route.ts` with proper ownership validation.

**Verify:**
- `POST /api/wallets` creates new wallet with valid Solana address
- `GET /api/wallets` returns only current user's wallets
- Invalid Solana addresses are rejected with proper error
- Duplicate wallet addresses are prevented
- User cannot access other users' wallets

**Done:** Complete wallet management API with authentication and validation

### Task 3: Build Add Wallet UI Component

**Files created:**
- `src/components/wallet/add-wallet-form.tsx`
- `src/components/wallet/wallet-card.tsx`
- `src/components/ui/form-field.tsx`
- `src/app/dashboard/wallets/add/page.tsx`

**Action:**
Create user-friendly forms for adding wallet addresses with validation, loading states, and error handling. Implement wallet address input with paste functionality and validation feedback.

```typescript
// src/components/wallet/add-wallet-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { isValidSolanaAddress } from '@/lib/wallet-validation';

const addWalletSchema = z.object({
  address: z.string().min(1, "Address is required").refine(isValidSolanaAddress, {
    message: "Invalid Solana wallet address"
  }),
  label: z.string().optional()
});

type AddWalletData = z.infer<typeof addWalletSchema>;

export function AddWalletForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AddWalletData>({
    resolver: zodResolver(addWalletSchema)
  });

  const addressValue = watch('address');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValue('address', text.trim());
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  const onSubmit = async (data: AddWalletData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add wallet');
      }

      toast.success('Wallet added successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Solana Wallet</CardTitle>
        <CardDescription>
          Add a Solana wallet address to import your trading history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="address">Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                {...register('address')}
                placeholder="Enter or paste Solana address..."
                className={errors.address ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
              >
                Paste
              </Button>
            </div>
            {errors.address && (
              <p className="text-sm text-destructive mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              {...register('label')}
              placeholder="e.g., Main Trading Wallet"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Adding Wallet...' : 'Add Wallet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

Create wallet display cards and list components for managing multiple wallets.

**Verify:**
- Wallet address input accepts valid Solana addresses
- Paste button works with clipboard API
- Form validation shows appropriate error messages
- Loading states display during submission
- Success/error notifications appear correctly

**Done:** User-friendly wallet addition interface with validation and error handling

### Task 4: Create Wallet Dashboard Views

**Files created:**
- `src/app/dashboard/page.tsx` (main dashboard)
- `src/app/dashboard/wallet/[walletId]/page.tsx` (individual wallet)
- `src/components/wallet/wallet-list.tsx`
- `src/components/wallet/wallet-selector.tsx`
- `src/components/dashboard/combined-dashboard.tsx`

**Action:**
Implement three dashboard views: combined dashboard showing all wallets, individual wallet dashboards, and wallet selector for navigation. Include basic wallet statistics and placeholders for trade data.

```typescript
// src/app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WalletList } from '@/components/wallet/wallet-list';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function Dashboard() {
  const userId = await requireAuth();
  
  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true },
    include: {
      _count: {
        select: { trades: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (wallets.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Welcome to ChainJournal</h2>
        <p className="text-muted-foreground mb-6">
          Get started by adding your first wallet address
        </p>
        <Link href="/dashboard/wallets/add">
          <Button>Add Wallet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <Link href="/dashboard/wallets/add">
          <Button>Add Wallet</Button>
        </Link>
      </div>

      <WalletList wallets={wallets} />
      
      {wallets.length > 1 && (
        <CombinedDashboard wallets={wallets} />
      )}
    </div>
  );
}
```

```typescript
// src/app/dashboard/wallet/[walletId]/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WalletPageProps {
  params: { walletId: string };
}

export default async function WalletPage({ params }: WalletPageProps) {
  const userId = await requireAuth();
  
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: params.walletId,
      userId,
      isActive: true
    },
    include: {
      _count: {
        select: { trades: true }
      }
    }
  });

  if (!wallet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {wallet.label || `Wallet ${wallet.address.slice(0, 8)}...`}
          </h1>
          <p className="text-muted-foreground">
            {wallet.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Trades</CardTitle>
            <CardDescription>Number of imported trades</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wallet._count.trades}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>P&L</CardTitle>
            <CardDescription>Total profit/loss</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">-</p>
            <p className="text-sm text-muted-foreground">
              Available after trade import
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Sync</CardTitle>
            <CardDescription>Most recent trade import</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">Never</p>
            <p className="text-sm text-muted-foreground">
              Import trades to see data
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Your trading activity for this wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No trades imported yet. Trade import coming in next plan.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Verify:**
- Main dashboard shows list of all user wallets
- Individual wallet pages display wallet-specific information
- Combined dashboard appears when user has multiple wallets
- Wallet statistics show placeholder data correctly
- Navigation between wallet views works smoothly

**Done:** Complete dashboard interface with multi-wallet support

### Task 5: Implement Wallet Removal Functionality

**Files modified:**
- `src/app/api/wallets/[walletId]/route.ts` (add DELETE method)
- `src/components/wallet/wallet-card.tsx` (add remove button)
- `src/components/wallet/remove-wallet-dialog.tsx`

**Action:**
Add wallet removal functionality with confirmation dialog and cascading delete of associated trade data. Ensure proper user authorization and data cleanup.

```typescript
// src/app/api/wallets/[walletId]/route.ts (add DELETE method)
export async function DELETE(
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

    // Delete wallet and associated trades (cascade delete)
    await prisma.wallet.update({
      where: { id: params.walletId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/components/wallet/remove-wallet-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface RemoveWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  walletAddress: string;
  onSuccess?: () => void;
}

export function RemoveWalletDialog({ 
  open, 
  onOpenChange, 
  walletId, 
  walletAddress,
  onSuccess 
}: RemoveWalletDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove wallet');
      }

      toast.success('Wallet removed successfully');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Wallet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this wallet address?
            <br />
            <code className="text-sm bg-muted px-1 py-0.5 rounded">
              {walletAddress.slice(0, 16)}...
            </code>
            <br />
            This will also delete all associated trade data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Removing...' : 'Remove Wallet'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Verify:**
- Remove wallet button shows confirmation dialog
- Wallet removal soft-deletes (sets isActive: false) the wallet
- Associated trade data is properly cleaned up
- User is redirected appropriately after wallet removal
- Only wallet owner can remove their own wallets

**Done:** Complete wallet removal functionality with proper data cleanup and authorization

### Task 6: Validate Wallet Management Requirements

**Action:**
Test all wallet management functionality to ensure requirements are met. Create comprehensive test scenarios covering edge cases and multi-wallet workflows.

**Test scenarios:**
1. Add first wallet address (valid Solana address)
2. Add second wallet with same address (should fail with error)
3. Add second wallet with different address (should succeed)
4. View combined dashboard with multiple wallets
5. Navigate to individual wallet dashboard
6. Remove one wallet and verify it disappears
7. Verify other user cannot access removed wallet

**Verify:**
- [ ] WALL-01: User can add Solana wallet address (paste address, read-only)
- [ ] WALL-02: User can add multiple wallet addresses to same account
- [ ] WALL-03: User can view separate dashboard per wallet
- [ ] WALL-04: User can view combined dashboard across all wallets
- [ ] WALL-05: User can remove wallet address from account

**Done:** All Phase 1 wallet management requirements validated and working

## Success Criteria

**Must be TRUE:**
1. Users can add multiple Solana wallet addresses with validation
2. Each wallet has its own dedicated dashboard view
3. Combined dashboard shows data across all user wallets
4. Users can remove wallet addresses and associated data
5. All wallet data is properly isolated between users
6. Database relationships support trade import and analytics

**Verification Commands:**
```bash
npx prisma db push
npx prisma studio
npm run dev
# Test wallet addition, viewing, and removal
```

**Artifacts Created:**
- Complete database schema with user isolation
- Wallet management API with CRUD operations
- Wallet addition and removal UI
- Individual and combined dashboard views
- Proper data validation and error handling