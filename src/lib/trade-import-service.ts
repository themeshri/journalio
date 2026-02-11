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

      // Update wallet sync timestamp
      const { SyncScheduler } = await import('./scheduler');
      await SyncScheduler.scheduleWalletSync(job.walletId);

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