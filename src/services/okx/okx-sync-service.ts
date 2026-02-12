import { OKXClient } from './okx-client';
import { OKXTransactionTransformer } from './okx-transformer';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface SyncResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  duplicates: number;
  errors: string[];
}

export class OKXSyncService {
  private client: OKXClient;
  private transformer: OKXTransactionTransformer;

  constructor() {
    this.client = new OKXClient();
    this.transformer = new OKXTransactionTransformer();
  }

  /**
   * Sync transactions from the last 24 hours
   */
  async sync24Hours(walletAddress: string, walletId: string): Promise<SyncResult> {
    const errors: string[] = [];
    
    // Update sync status to in_progress
    await this.updateSyncStatus(walletId, 'in_progress');

    try {
      // Fetch all transactions from the past 24 hours
      console.log(`Starting 24h sync for wallet ${walletAddress}`);
      const allTransactions = await this.client.fetch24HourHistory(walletAddress);
      
      console.log(`Fetched ${allTransactions.length} transactions from OKX`);

      // Transform and save transactions
      let savedCount = 0;
      let duplicateCount = 0;

      for (const okxTx of allTransactions) {
        try {
          // Check if transaction already exists
          const existing = await prisma.trade.findFirst({
            where: OKXTransactionTransformer.buildDuplicateCheck(okxTx.txHash)
          });
          
          if (existing) {
            duplicateCount++;
            console.log(`Skipping duplicate transaction: ${okxTx.txHash}`);
            continue;
          }

          // Transform OKX transaction to Trade format
          const tradeData = await this.transformer.transformToTrade(
            okxTx,
            walletId,
            walletAddress
          );

          // Save to database
          await prisma.trade.create({ data: tradeData });
          savedCount++;
          
          console.log(`Saved transaction: ${okxTx.txHash}`);
        } catch (error) {
          const errorMsg = `Failed to process transaction ${okxTx.txHash}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Update sync status to success
      await this.updateSyncStatus(
        walletId,
        'success',
        savedCount,
        undefined,
        errors.length > 0 ? errors.join('; ') : undefined
      );

      return {
        success: true,
        totalFetched: allTransactions.length,
        totalSaved: savedCount,
        duplicates: duplicateCount,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sync failed:', errorMsg);
      
      // Update sync status to failed
      await this.updateSyncStatus(walletId, 'failed', 0, undefined, errorMsg);
      
      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Sync transactions with custom date range
   */
  async syncDateRange(
    walletAddress: string,
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SyncResult> {
    const errors: string[] = [];
    
    // Update sync status to in_progress
    await this.updateSyncStatus(walletId, 'in_progress');

    try {
      const begin = startDate.getTime();
      const end = endDate.getTime();
      
      let allTransactions: any[] = [];
      let cursor: string | undefined;
      let hasMore = true;
      
      // Fetch paginated results
      while (hasMore) {
        const response = await this.client.fetchTransactionHistory(walletAddress, {
          cursor,
          begin,
          end,
          limit: 100
        });

        if (response.data?.[0]?.transactions) {
          const transactions = response.data[0].transactions;
          allTransactions = allTransactions.concat(transactions);
          cursor = response.data[0].cursor;
          
          // Check if we should continue
          hasMore = transactions.length === 100;
        } else {
          hasMore = false;
        }
        
        // Rate limit: 1 second delay between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Fetched ${allTransactions.length} transactions from OKX`);

      // Transform and save transactions
      let savedCount = 0;
      let duplicateCount = 0;

      for (const okxTx of allTransactions) {
        try {
          // Check if transaction already exists
          const existing = await prisma.trade.findFirst({
            where: OKXTransactionTransformer.buildDuplicateCheck(okxTx.txHash)
          });
          
          if (existing) {
            duplicateCount++;
            continue;
          }

          // Transform and save
          const tradeData = await this.transformer.transformToTrade(
            okxTx,
            walletId,
            walletAddress
          );
          await prisma.trade.create({ data: tradeData });
          savedCount++;
          
        } catch (error) {
          const errorMsg = `Failed to process transaction ${okxTx.txHash}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      // Update sync status
      await this.updateSyncStatus(
        walletId,
        'success',
        savedCount,
        cursor,
        errors.length > 0 ? errors.join('; ') : undefined
      );

      return {
        success: true,
        totalFetched: allTransactions.length,
        totalSaved: savedCount,
        duplicates: duplicateCount,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateSyncStatus(walletId, 'failed', 0, undefined, errorMsg);
      
      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    walletId: string,
    status: 'in_progress' | 'success' | 'failed',
    totalSynced?: number,
    lastCursor?: string,
    errorMessage?: string
  ) {
    await prisma.oKXSyncStatus.upsert({
      where: { walletId },
      update: {
        syncStatus: status,
        lastSyncAt: new Date(),
        ...(totalSynced !== undefined && { transactionsImported: totalSynced }),
        ...(errorMessage !== undefined && { errors: errorMessage ? { error: errorMessage } : null }),
      },
      create: {
        walletId,
        syncStatus: status,
        lastSyncAt: new Date(),
        transactionsImported: totalSynced || 0,
        errors: errorMessage ? { error: errorMessage } : null,
      }
    });
  }

  /**
   * Get sync status for a wallet
   */
  static async getSyncStatus(walletId: string) {
    return prisma.oKXSyncStatus.findUnique({
      where: { walletId }
    });
  }
}