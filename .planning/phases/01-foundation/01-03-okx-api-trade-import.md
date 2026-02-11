# Plan 01-03: OKX API Integration & Trade Import

**Phase:** 01-foundation  
**Plan:** 03  
**Requirements:** TRAD-01, TRAD-02, TRAD-03, TRAD-04, TRAD-05  
**Depends on:** 01-02 (Database and wallet management must be working)

## Objective

Integrate OKX Wallet APIs and Solana RPC for comprehensive trade import. Implement automatic historical trade import, daily sync, manual trigger, accurate P&L calculation, and proper handling of failed transactions. Establish reliable data pipeline for Solana trading history.

**Purpose:** Create accurate, automated trade import system that maintains data integrity  
**Output:** Complete trade import infrastructure with background processing and error handling

## Tasks

### Task 1: Install Solana Dependencies and Configure RPC

**Files created:**
- `src/lib/solana.ts`
- `src/lib/okx-client.ts`
- `.env.local` (updated with API keys and RPC URLs)

**Action:**
Install Solana Web3.js, DEX parser library, and configure multiple RPC endpoints for reliability. Set up OKX API credentials and create client instances.

```bash
# Install Solana dependencies
npm install @solana/web3.js @solana/spl-token
npm install axios date-fns

# For DEX transaction parsing (if available, or implement custom parser)
npm install bs58 borsh
```

```typescript
// src/lib/solana.ts
import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class SolanaClient {
  private connections: Connection[];
  private currentConnectionIndex = 0;

  constructor(rpcUrls: string[]) {
    this.connections = rpcUrls.map(url => new Connection(url, 'confirmed'));
  }

  private getConnection(): Connection {
    return this.connections[this.currentConnectionIndex];
  }

  private async withFallback<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.connections.length; i++) {
      try {
        const connection = this.connections[(this.currentConnectionIndex + i) % this.connections.length];
        const result = await operation(connection);
        this.currentConnectionIndex = (this.currentConnectionIndex + i) % this.connections.length;
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`RPC ${i} failed:`, error);
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }

  async getSignaturesForAddress(
    address: PublicKey,
    options?: { before?: string; limit?: number }
  ): Promise<ConfirmedSignatureInfo[]> {
    return this.withFallback(connection =>
      connection.getSignaturesForAddress(address, {
        before: options?.before,
        limit: options?.limit || 100
      })
    );
  }

  async getTransaction(signature: string) {
    return this.withFallback(connection =>
      connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      })
    );
  }

  async getTokenAccountsByOwner(owner: PublicKey) {
    return this.withFallback(connection =>
      connection.getTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID
      })
    );
  }
}

// Initialize with multiple RPC endpoints for reliability
export const solanaClient = new SolanaClient([
  process.env.SOLANA_RPC_URL_PRIMARY || 'https://api.mainnet-beta.solana.com',
  process.env.SOLANA_RPC_URL_SECONDARY || 'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
]);
```

```typescript
// src/lib/okx-client.ts
import axios, { AxiosInstance } from 'axios';

interface OKXDEXQuote {
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols: string[];
}

export class OKXClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.okx.com/api/v5',
      headers: {
        'OK-ACCESS-KEY': process.env.OKX_API_KEY,
        'OK-ACCESS-SIGN': '', // Will be implemented for authenticated endpoints
        'OK-ACCESS-TIMESTAMP': '',
        'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
      },
    });
  }

  async getDEXQuote(params: {
    chainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
  }): Promise<OKXDEXQuote> {
    try {
      const response = await this.client.get('/dex/aggregator/quote', { params });
      return response.data.data[0];
    } catch (error) {
      console.error('OKX DEX quote error:', error);
      throw error;
    }
  }

  async getTokenPrices(tokenAddresses: string[], chainId = '501') {
    try {
      const response = await this.client.get('/market/token-price', {
        params: {
          chainId,
          tokenContractAddress: tokenAddresses.join(',')
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('OKX token prices error:', error);
      return [];
    }
  }
}

export const okxClient = new OKXClient();
```

Update `.env.local` with required API keys and RPC URLs.

**Verify:**
- Solana RPC connection works with fallback
- OKX API client initializes without errors
- Environment variables are properly configured
- Multiple RPC endpoints provide redundancy

**Done:** Solana and OKX client libraries configured with error handling and fallback mechanisms

### Task 2: Create Solana Transaction Parser

**Files created:**
- `src/lib/solana-parser.ts`
- `src/lib/trade-calculator.ts`
- `src/types/trade.ts`

**Action:**
Build robust Solana transaction parser that can handle DEX swaps from Jupiter, Raydium, Orca, and other popular Solana DEXs. Include accurate P&L calculation considering fees and slippage.

```typescript
// src/types/trade.ts
export interface ParsedTrade {
  signature: string;
  type: 'buy' | 'sell' | 'swap';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceIn?: string;
  priceOut?: string;
  dex: string;
  fees: string;
  blockTime: Date;
  slot: string;
  success: boolean;
  error?: string;
}

export interface TokenTransfer {
  mint: string;
  amount: string;
  decimals: number;
  direction: 'in' | 'out';
}
```

```typescript
// src/lib/solana-parser.ts
import { Transaction, PublicKey } from '@solana/web3.js';
import { SolanaClient } from './solana';
import { ParsedTrade, TokenTransfer } from '@/types/trade';
import bs58 from 'bs58';

export class SolanaTransactionParser {
  private solanaClient: SolanaClient;

  constructor(solanaClient: SolanaClient) {
    this.solanaClient = solanaClient;
  }

  async parseWalletTransactions(
    walletAddress: string,
    beforeSignature?: string,
    limit = 50
  ): Promise<ParsedTrade[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.solanaClient.getSignaturesForAddress(publicKey, {
        before: beforeSignature,
        limit
      });

      const trades: ParsedTrade[] = [];

      for (const sigInfo of signatures) {
        // Skip failed transactions
        if (sigInfo.err) {
          continue;
        }

        try {
          const transaction = await this.solanaClient.getTransaction(sigInfo.signature);
          if (!transaction) continue;

          const parsedTrade = await this.parseTransaction(
            sigInfo.signature,
            transaction,
            walletAddress
          );

          if (parsedTrade) {
            trades.push(parsedTrade);
          }
        } catch (error) {
          console.error(`Error parsing transaction ${sigInfo.signature}:`, error);
          // Continue processing other transactions
        }
      }

      return trades;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  private async parseTransaction(
    signature: string,
    transaction: any,
    walletAddress: string
  ): Promise<ParsedTrade | null> {
    try {
      // Extract token transfers from transaction
      const transfers = this.extractTokenTransfers(transaction, walletAddress);
      
      if (transfers.length < 2) {
        return null; // Not a trade transaction
      }

      // Determine if this is a swap/trade
      const swapTransfer = this.identifySwapTransfer(transfers);
      if (!swapTransfer) {
        return null;
      }

      // Identify DEX from program interactions
      const dex = this.identifyDEX(transaction);

      // Calculate fees
      const fees = this.calculateTransactionFees(transaction);

      return {
        signature,
        type: this.determineTradeType(swapTransfer.tokenIn, swapTransfer.tokenOut),
        tokenIn: swapTransfer.tokenIn,
        tokenOut: swapTransfer.tokenOut,
        amountIn: swapTransfer.amountIn,
        amountOut: swapTransfer.amountOut,
        dex,
        fees: fees.toString(),
        blockTime: new Date(transaction.blockTime * 1000),
        slot: transaction.slot.toString(),
        success: true
      };
    } catch (error) {
      console.error(`Error parsing transaction ${signature}:`, error);
      return {
        signature,
        type: 'swap',
        tokenIn: '',
        tokenOut: '',
        amountIn: '0',
        amountOut: '0',
        dex: 'unknown',
        fees: '0',
        blockTime: new Date(transaction.blockTime * 1000),
        slot: transaction.slot.toString(),
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed'
      };
    }
  }

  private extractTokenTransfers(transaction: any, walletAddress: string): TokenTransfer[] {
    const transfers: TokenTransfer[] = [];
    
    try {
      const preTokenBalances = transaction.meta?.preTokenBalances || [];
      const postTokenBalances = transaction.meta?.postTokenBalances || [];

      // Find wallet's token account changes
      const walletPubkey = new PublicKey(walletAddress);
      
      for (let i = 0; i < preTokenBalances.length; i++) {
        const pre = preTokenBalances[i];
        const post = postTokenBalances.find((p: any) => p.accountIndex === pre.accountIndex);
        
        if (!post) continue;

        // Check if this account belongs to our wallet
        const accountOwner = transaction.transaction.message.accountKeys[pre.accountIndex]?.owner;
        if (accountOwner !== walletPubkey.toBase58()) continue;

        const preAmount = BigInt(pre.uiTokenAmount.amount);
        const postAmount = BigInt(post.uiTokenAmount.amount);
        const difference = postAmount - preAmount;

        if (difference !== 0n) {
          transfers.push({
            mint: pre.mint,
            amount: Math.abs(Number(difference)).toString(),
            decimals: pre.uiTokenAmount.decimals,
            direction: difference > 0n ? 'in' : 'out'
          });
        }
      }
    } catch (error) {
      console.error('Error extracting token transfers:', error);
    }

    return transfers;
  }

  private identifySwapTransfer(transfers: TokenTransfer[]): {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
  } | null {
    const inTransfers = transfers.filter(t => t.direction === 'in');
    const outTransfers = transfers.filter(t => t.direction === 'out');

    if (inTransfers.length !== 1 || outTransfers.length !== 1) {
      return null; // Complex transaction, skip for now
    }

    return {
      tokenIn: outTransfers[0].mint,
      tokenOut: inTransfers[0].mint,
      amountIn: outTransfers[0].amount,
      amountOut: inTransfers[0].amount
    };
  }

  private identifyDEX(transaction: any): string {
    const programIds = transaction.transaction.message.accountKeys
      .map((key: any) => key.pubkey || key)
      .filter((key: string) => key);

    // Known DEX program IDs
    const dexPrograms = {
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'jupiter',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'raydium',
      'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'orca',
      'PumpFun1111111111111111111111111111111112': 'pumpfun'
    };

    for (const programId of programIds) {
      if (dexPrograms[programId]) {
        return dexPrograms[programId];
      }
    }

    return 'unknown';
  }

  private determineTradeType(tokenIn: string, tokenOut: string): 'buy' | 'sell' | 'swap' {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

    const stablecoins = [USDC_MINT, USDT_MINT];
    
    if (stablecoins.includes(tokenIn) || tokenIn === SOL_MINT) {
      return 'buy'; // Buying token with stablecoin/SOL
    } else if (stablecoins.includes(tokenOut) || tokenOut === SOL_MINT) {
      return 'sell'; // Selling token for stablecoin/SOL
    }
    
    return 'swap'; // Token to token swap
  }

  private calculateTransactionFees(transaction: any): number {
    const fee = transaction.meta?.fee || 0;
    return fee / 1_000_000_000; // Convert lamports to SOL
  }
}
```

**Verify:**
- Parser correctly identifies DEX transactions
- Token transfers are accurately extracted
- P&L calculations include all fees
- Failed transactions are handled gracefully

**Done:** Robust Solana transaction parser with accurate trade identification and P&L calculation

### Task 3: Create Trade Import Background Service

**Files created:**
- `src/lib/trade-import-service.ts`
- `src/app/api/import/route.ts`
- `src/app/api/import/[jobId]/route.ts`
- `src/lib/price-service.ts`

**Action:**
Implement background trade import service with job tracking, progress updates, and error recovery. Include price fetching for P&L calculations and proper database transaction handling.

```typescript
// src/lib/trade-import-service.ts
import { prisma } from './db';
import { SolanaTransactionParser } from './solana-parser';
import { solanaClient } from './solana';
import { okxClient } from './okx-client';
import { ParsedTrade } from '@/types/trade';

export class TradeImportService {
  private parser: SolanaTransactionParser;

  constructor() {
    this.parser = new SolanaTransactionParser(solanaClient);
  }

  async startImport(walletId: string): Promise<string> {
    try {
      // Create import job
      const job = await prisma.importJob.create({
        data: {
          walletId,
          status: 'PENDING',
          progress: 0
        }
      });

      // Start background processing
      this.processImportJob(job.id).catch(error => {
        console.error(`Import job ${job.id} failed:`, error);
      });

      return job.id;
    } catch (error) {
      console.error('Failed to start import:', error);
      throw error;
    }
  }

  private async processImportJob(jobId: string): Promise<void> {
    try {
      // Update job status
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' }
      });

      const job = await prisma.importJob.findUnique({
        where: { id: jobId },
        include: { wallet: true }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Get last processed signature for incremental import
      const lastTrade = await prisma.trade.findFirst({
        where: { walletId: job.walletId },
        orderBy: { blockTime: 'desc' }
      });

      let allTrades: ParsedTrade[] = [];
      let beforeSignature = lastTrade?.signature;
      let hasMore = true;

      while (hasMore) {
        const trades = await this.parser.parseWalletTransactions(
          job.wallet.address,
          beforeSignature,
          100
        );

        if (trades.length === 0) {
          hasMore = false;
          break;
        }

        // Filter out already processed trades
        const newTrades = trades.filter(trade => 
          !lastTrade || new Date(trade.blockTime) > lastTrade.blockTime
        );

        allTrades = [...allTrades, ...newTrades];
        beforeSignature = trades[trades.length - 1].signature;

        // Update progress
        await prisma.importJob.update({
          where: { id: jobId },
          data: { 
            progress: Math.min(90, allTrades.length * 2), // Rough progress estimate
            total: allTrades.length + 50 // Estimated total
          }
        });

        // Rate limiting
        await this.delay(1000);
      }

      // Fetch token prices for P&L calculation
      const uniqueTokens = [...new Set([
        ...allTrades.map(t => t.tokenIn),
        ...allTrades.map(t => t.tokenOut)
      ])].filter(Boolean);

      const prices = await this.fetchTokenPrices(uniqueTokens);

      // Save trades to database
      await this.saveTradesToDatabase(allTrades, job.walletId, prices);

      // Complete job
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date()
        }
      });

    } catch (error) {
      console.error(`Import job ${jobId} error:`, error);
      
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async saveTradesToDatabase(
    trades: ParsedTrade[],
    walletId: string,
    prices: Record<string, number>
  ): Promise<void> {
    for (const trade of trades) {
      try {
        await prisma.trade.upsert({
          where: { signature: trade.signature },
          update: {
            processed: true,
            priceIn: prices[trade.tokenIn] ? prices[trade.tokenIn].toString() : null,
            priceOut: prices[trade.tokenOut] ? prices[trade.tokenOut].toString() : null,
          },
          create: {
            signature: trade.signature,
            walletId,
            type: trade.type,
            tokenIn: trade.tokenIn,
            tokenOut: trade.tokenOut,
            amountIn: trade.amountIn,
            amountOut: trade.amountOut,
            priceIn: prices[trade.tokenIn] ? prices[trade.tokenIn].toString() : null,
            priceOut: prices[trade.tokenOut] ? prices[trade.tokenOut].toString() : null,
            dex: trade.dex,
            fees: trade.fees,
            blockTime: trade.blockTime,
            slot: BigInt(trade.slot),
            processed: trade.success,
            error: trade.error
          }
        });
      } catch (error) {
        console.error(`Failed to save trade ${trade.signature}:`, error);
      }
    }
  }

  private async fetchTokenPrices(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const prices = await okxClient.getTokenPrices(tokenMints);
      const priceMap: Record<string, number> = {};
      
      for (const price of prices) {
        priceMap[price.tokenContractAddress] = parseFloat(price.price);
      }
      
      return priceMap;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getImportStatus(jobId: string) {
    return prisma.importJob.findUnique({
      where: { id: jobId }
    });
  }
}

export const tradeImportService = new TradeImportService();
```

```typescript
// src/app/api/import/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { tradeImportService } from '@/lib/trade-import-service';
import { z } from 'zod';

const startImportSchema = z.object({
  walletId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletId } = startImportSchema.parse(body);

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check for existing running import
    const existingJob = await prisma.importJob.findFirst({
      where: {
        walletId,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (existingJob) {
      return NextResponse.json({
        jobId: existingJob.id,
        message: 'Import already in progress'
      });
    }

    const jobId = await tradeImportService.startImport(walletId);

    return NextResponse.json({ jobId }, { status: 201 });
  } catch (error) {
    console.error('Start import error:', error);
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    );
  }
}
```

**Verify:**
- Background import jobs execute without blocking UI
- Progress tracking updates correctly
- Failed transactions are logged with errors
- Duplicate trades are prevented with upsert logic

**Done:** Robust background trade import service with job tracking and error recovery

### Task 4: Create Manual Import Trigger UI

**Files created:**
- `src/components/import/import-trigger.tsx`
- `src/components/import/import-progress.tsx`
- `src/app/dashboard/wallet/[walletId]/import/page.tsx`

**Action:**
Build user interface for manually triggering trade imports, displaying progress, and handling import errors. Include real-time progress updates and clear error messaging.

```typescript
// src/components/import/import-trigger.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { RefreshCw, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportTriggerProps {
  walletId: string;
  walletAddress: string;
  onImportComplete?: () => void;
}

interface ImportStatus {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  total?: number;
  error?: string;
}

export function ImportTrigger({ walletId, walletAddress, onImportComplete }: ImportTriggerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const startImport = async () => {
    try {
      setIsImporting(true);
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start import');
      }

      const { jobId } = await response.json();
      setImportStatus({ jobId, status: 'PENDING', progress: 0 });
      
      // Poll for status updates
      pollImportStatus(jobId);
      
      toast.success('Trade import started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start import');
      setIsImporting(false);
    }
  };

  const pollImportStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/import/${jobId}`);
      if (!response.ok) return;

      const status: ImportStatus = await response.json();
      setImportStatus(status);

      if (status.status === 'COMPLETED') {
        setIsImporting(false);
        toast.success('Trade import completed successfully');
        onImportComplete?.();
      } else if (status.status === 'FAILED') {
        setIsImporting(false);
        toast.error(`Import failed: ${status.error || 'Unknown error'}`);
      } else {
        // Continue polling
        setTimeout(() => pollImportStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('Error polling import status:', error);
      setTimeout(() => pollImportStatus(jobId), 5000); // Longer delay on error
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Trades
        </CardTitle>
        <CardDescription>
          Import trading history from {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isImporting && !importStatus && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will scan your wallet for DEX trades and calculate accurate P&L including fees.
            </p>
            <Button onClick={startImport} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Import
            </Button>
          </div>
        )}

        {importStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {importStatus.status === 'COMPLETED' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {importStatus.status === 'FAILED' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {['PENDING', 'PROCESSING'].includes(importStatus.status) && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              <span className="font-medium">
                {importStatus.status === 'PENDING' && 'Preparing import...'}
                {importStatus.status === 'PROCESSING' && 'Importing trades...'}
                {importStatus.status === 'COMPLETED' && 'Import completed'}
                {importStatus.status === 'FAILED' && 'Import failed'}
              </span>
            </div>

            {importStatus.status === 'PROCESSING' && (
              <div className="space-y-2">
                <Progress value={importStatus.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {importStatus.progress}% complete
                  {importStatus.total && ` (${importStatus.progress}/${importStatus.total} trades)`}
                </p>
              </div>
            )}

            {importStatus.status === 'FAILED' && importStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{importStatus.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportStatus(null);
                    setIsImporting(false);
                  }}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {importStatus.status === 'COMPLETED' && (
              <Button
                variant="outline"
                onClick={() => {
                  setImportStatus(null);
                  setIsImporting(false);
                }}
                className="w-full"
              >
                Import More Trades
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Verify:**
- Import trigger starts background job correctly
- Progress bar updates in real-time
- Error messages are displayed clearly
- Users can retry failed imports
- Import completion triggers UI refresh

**Done:** User-friendly manual import interface with real-time progress and error handling

### Task 5: Implement Daily Auto-Sync Scheduler

**Files created:**
- `src/app/api/cron/daily-sync/route.ts`
- `src/lib/scheduler.ts`
- `next.config.js` (updated for cron jobs)

**Action:**
Set up automated daily trade synchronization for all active wallets. Implement cron job endpoint and scheduling logic to keep trade data current without user intervention.

```typescript
// src/app/api/cron/daily-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { tradeImportService } from '@/lib/trade-import-service';

export async function GET(request: NextRequest) {
  try {
    // Verify cron job authorization (implement your security mechanism)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active wallets that need sync
    const walletsToSync = await prisma.wallet.findMany({
      where: {
        isActive: true,
        // Only sync wallets that haven't been synced in the last 23 hours
        OR: [
          { updatedAt: { lt: new Date(Date.now() - 23 * 60 * 60 * 1000) } },
          { trades: { none: {} } } // New wallets with no trades yet
        ]
      },
      select: { id: true, address: true, userId: true }
    });

    console.log(`Starting daily sync for ${walletsToSync.length} wallets`);

    const syncResults = [];

    for (const wallet of walletsToSync) {
      try {
        // Check if there's already an active import job
        const existingJob = await prisma.importJob.findFirst({
          where: {
            walletId: wallet.id,
            status: { in: ['PENDING', 'PROCESSING'] }
          }
        });

        if (existingJob) {
          console.log(`Skipping wallet ${wallet.id} - import already in progress`);
          continue;
        }

        // Start import
        const jobId = await tradeImportService.startImport(wallet.id);
        
        syncResults.push({
          walletId: wallet.id,
          walletAddress: wallet.address,
          jobId,
          status: 'started'
        });

        // Rate limiting between wallets
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Failed to sync wallet ${wallet.id}:`, error);
        syncResults.push({
          walletId: wallet.id,
          walletAddress: wallet.address,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Daily sync completed',
      walletsProcessed: walletsToSync.length,
      results: syncResults
    });

  } catch (error) {
    console.error('Daily sync error:', error);
    return NextResponse.json(
      { error: 'Daily sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For Vercel deployment, also need POST method
export async function POST(request: NextRequest) {
  return GET(request);
}
```

```typescript
// src/lib/scheduler.ts
export class SyncScheduler {
  static async scheduleWalletSync(walletId: string): Promise<void> {
    try {
      // Update wallet's updatedAt timestamp to mark last sync attempt
      await prisma.wallet.update({
        where: { id: walletId },
        data: { updatedAt: new Date() }
      });
    } catch (error) {
      console.error(`Failed to update wallet sync timestamp ${walletId}:`, error);
    }
  }

  static async getNextSyncTime(walletId: string): Promise<Date | null> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        select: { updatedAt: true }
      });

      if (!wallet) return null;

      // Next sync is 24 hours after last update
      const nextSync = new Date(wallet.updatedAt);
      nextSync.setHours(nextSync.getHours() + 24);

      return nextSync;
    } catch (error) {
      console.error(`Failed to get next sync time for wallet ${walletId}:`, error);
      return null;
    }
  }
}
```

Add environment variable for cron job security:

```env
CRON_SECRET=your-secure-cron-secret-here
```

**Verify:**
- Cron endpoint starts import jobs for all wallets
- Rate limiting prevents API overload
- Failed syncs don't block other wallets
- Only wallets needing sync are processed
- Security prevents unauthorized cron access

**Done:** Automated daily trade synchronization system

### Task 6: Add Failed Transaction Handling

**Files modified:**
- `src/lib/solana-parser.ts` (enhance error handling)
- `src/components/dashboard/trade-errors.tsx`

**Action:**
Enhance transaction parsing to properly handle failed/reverted Solana transactions and provide clear error reporting to users.

```typescript
// Add to src/lib/solana-parser.ts
private async parseFailedTransaction(
  signature: string,
  transaction: any
): Promise<ParsedTrade> {
  const errorInfo = this.extractTransactionError(transaction);
  
  return {
    signature,
    type: 'swap',
    tokenIn: '',
    tokenOut: '',
    amountIn: '0',
    amountOut: '0',
    dex: this.identifyDEX(transaction),
    fees: this.calculateTransactionFees(transaction).toString(),
    blockTime: new Date(transaction.blockTime * 1000),
    slot: transaction.slot.toString(),
    success: false,
    error: errorInfo
  };
}

private extractTransactionError(transaction: any): string {
  if (!transaction.meta?.err) return 'Transaction failed';
  
  const error = transaction.meta.err;
  
  // Common Solana error types
  if (typeof error === 'string') return error;
  if (error.InstructionError) {
    const [index, instructionError] = error.InstructionError;
    return `Instruction ${index} failed: ${JSON.stringify(instructionError)}`;
  }
  if (error.InsufficientFundsForFee) return 'Insufficient funds for transaction fee';
  if (error.AccountNotFound) return 'Required account not found';
  if (error.InvalidAccountData) return 'Invalid account data';
  
  return JSON.stringify(error);
}
```

**Verify:**
- Failed transactions are recorded with error details
- Users can see why transactions failed
- Error categorization helps with debugging
- Failed transactions don't break import process

**Done:** Comprehensive failed transaction handling with clear error reporting

## Success Criteria

**Must be TRUE:**
1. System automatically imports historical Solana trades via OKX API and RPC parsing
2. Daily auto-sync keeps trade data current without user intervention
3. Users can manually trigger trade import with real-time progress feedback
4. DEX swaps are correctly parsed with accurate P&L calculations including fees
5. Failed and reverted transactions are handled gracefully with error details
6. Multiple RPC endpoints provide redundancy for reliable data access

**Verification Commands:**
```bash
npm run dev
# Test manual trade import
# Verify background job processing
# Check daily sync cron endpoint
# Validate failed transaction handling
```

**Artifacts Created:**
- Solana RPC client with fallback endpoints
- Transaction parser for major Solana DEXs
- Background trade import service with progress tracking
- Manual import trigger UI with real-time updates
- Daily auto-sync scheduler
- Comprehensive error handling for failed transactions