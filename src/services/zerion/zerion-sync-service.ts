import { ZerionClient } from './zerion-client';
import { ZerionTransactionTransformer } from './zerion-transformer';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface ZerionSyncResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  duplicates: number;
  errors: string[];
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export class ZerionSyncService {
  private client: ZerionClient;
  private transformer: ZerionTransactionTransformer;

  constructor(apiKey?: string) {
    this.client = new ZerionClient(apiKey);
    this.transformer = new ZerionTransactionTransformer();
  }

  /**
   * Sync transactions from the last 24 hours
   */
  async sync24Hours(walletAddress: string, walletId: string): Promise<ZerionSyncResult> {
    const errors: string[] = [];
    
    // Update sync status to in_progress (will be added to schema)
    await this.updateSyncStatus(walletId, 'in_progress');

    try {
      console.log(`[Zerion] Starting 24h sync for wallet ${walletAddress}`);
      
      // Fetch 24-hour transactions
      const allTransactions = await this.client.fetch24HourTransactions(walletAddress);
      console.log(`[Zerion] Fetched ${allTransactions.length} transactions`);

      // Transform and save transactions
      const syncResult = await this.processTransactions(
        allTransactions, 
        walletId, 
        walletAddress
      );

      // Update sync status to success
      await this.updateSyncStatus(
        walletId,
        'success',
        syncResult.totalSaved,
        undefined,
        errors.length > 0 ? errors.join('; ') : undefined,
        {
          high: syncResult.highConfidence,
          medium: syncResult.mediumConfidence,
          low: syncResult.lowConfidence
        }
      );

      return {
        ...syncResult,
        totalFetched: allTransactions.length,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Zerion] Sync failed:', errorMsg);
      
      // Update sync status to failed
      await this.updateSyncStatus(walletId, 'failed', 0, undefined, errorMsg);
      
      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [errorMsg],
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0
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
  ): Promise<ZerionSyncResult> {
    const errors: string[] = [];
    
    // Update sync status to in_progress
    await this.updateSyncStatus(walletId, 'in_progress');

    try {
      console.log(`[Zerion] Starting date range sync for wallet ${walletAddress} (${startDate.toISOString()} to ${endDate.toISOString()})`);
      
      // Fetch transactions in date range
      const allTransactions = await this.client.fetchTransactionsByDateRange(
        walletAddress, 
        startDate, 
        endDate
      );
      
      console.log(`[Zerion] Fetched ${allTransactions.length} transactions in date range`);

      // Transform and save transactions
      const syncResult = await this.processTransactions(
        allTransactions, 
        walletId, 
        walletAddress
      );

      // Update sync status
      await this.updateSyncStatus(
        walletId,
        'success',
        syncResult.totalSaved,
        undefined,
        errors.length > 0 ? errors.join('; ') : undefined,
        {
          high: syncResult.highConfidence,
          medium: syncResult.mediumConfidence,
          low: syncResult.lowConfidence
        }
      );

      return {
        ...syncResult,
        totalFetched: allTransactions.length,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Zerion] Date range sync failed:', errorMsg);
      
      await this.updateSyncStatus(walletId, 'failed', 0, undefined, errorMsg);
      
      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [errorMsg],
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0
      };
    }
  }

  /**
   * Sync all transactions for a wallet (use with caution for large wallets)
   */
  async syncAllTransactions(
    walletAddress: string,
    walletId: string,
    options: { pageLimit?: number } = {}
  ): Promise<ZerionSyncResult> {
    const errors: string[] = [];
    
    // Update sync status to in_progress
    await this.updateSyncStatus(walletId, 'in_progress');

    try {
      console.log(`[Zerion] Starting full sync for wallet ${walletAddress}`);
      
      // Fetch all transactions with optional page limit
      const allTransactions = await this.client.fetchAllTransactions(walletAddress, {
        pageSize: 100,
        chainIds: ['solana'] // Focus on Solana for now
      });
      
      // Apply page limit if specified
      const transactionsToProcess = options.pageLimit 
        ? allTransactions.slice(0, options.pageLimit * 100)
        : allTransactions;
      
      console.log(`[Zerion] Processing ${transactionsToProcess.length} transactions`);

      // Transform and save transactions
      const syncResult = await this.processTransactions(
        transactionsToProcess, 
        walletId, 
        walletAddress
      );

      // Update sync status
      await this.updateSyncStatus(
        walletId,
        'success',
        syncResult.totalSaved,
        undefined,
        errors.length > 0 ? errors.join('; ') : undefined,
        {
          high: syncResult.highConfidence,
          medium: syncResult.mediumConfidence,
          low: syncResult.lowConfidence
        }
      );

      return {
        ...syncResult,
        totalFetched: transactionsToProcess.length,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Zerion] Full sync failed:', errorMsg);
      
      await this.updateSyncStatus(walletId, 'failed', 0, undefined, errorMsg);
      
      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [errorMsg],
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0
      };
    }
  }

  /**
   * Process transactions: transform, check duplicates, and save
   */
  private async processTransactions(
    transactions: any[],
    walletId: string,
    walletAddress: string
  ) {
    let savedCount = 0;
    let duplicateCount = 0;
    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;
    const errors: string[] = [];

    for (const zerionTx of transactions) {
      try {
        // Check if transaction already exists
        const existing = await prisma.trade.findFirst({
          where: ZerionTransactionTransformer.buildDuplicateCheck(
            zerionTx.attributes.hash,
            zerionTx.id
          )
        });
        
        if (existing) {
          duplicateCount++;
          console.log(`[Zerion] Skipping duplicate transaction: ${zerionTx.attributes.hash}`);
          continue;
        }

        // Transform Zerion transaction to Trade format
        const transformResult = await this.transformer.transformToTrade(
          zerionTx,
          walletId,
          walletAddress
        );

        // Count confidence levels
        switch (transformResult.confidence) {
          case 'high': highConfidence++; break;
          case 'medium': mediumConfidence++; break;
          case 'low': lowConfidence++; break;
        }

        // Log warnings if any
        if (transformResult.warnings.length > 0) {
          console.warn(`[Zerion] Warnings for ${zerionTx.attributes.hash}:`, transformResult.warnings);
        }

        // Save to database
        await prisma.trade.create({ data: transformResult.trade });
        savedCount++;
        
        console.log(`[Zerion] Saved transaction: ${zerionTx.attributes.hash} (${transformResult.confidence} confidence)`);
      } catch (error) {
        const errorMsg = `Failed to process transaction ${zerionTx.attributes?.hash || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Zerion] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return {
      success: true,
      totalSaved: savedCount,
      duplicates: duplicateCount,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      errors
    };
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    walletId: string,
    status: 'in_progress' | 'success' | 'failed',
    totalSynced?: number,
    lastCursor?: string,
    errorMessage?: string,
    confidenceStats?: { high: number; medium: number; low: number }
  ) {
    try {
      console.log(`[Zerion] Sync status update for wallet ${walletId}: ${status}`);
      
      await prisma.zerionSyncStatus.upsert({
        where: { walletId },
        update: {
          syncStatus: status,
          lastSyncAt: new Date(),
          ...(totalSynced !== undefined && { transactionsImported: totalSynced }),
          ...(lastCursor !== undefined && { lastCursor }),
          ...(errorMessage !== undefined && { errors: errorMessage ? { error: errorMessage } : null }),
          ...(confidenceStats && {
            highConfidenceCount: confidenceStats.high,
            mediumConfidenceCount: confidenceStats.medium,
            lowConfidenceCount: confidenceStats.low,
          }),
        },
        create: {
          walletId,
          syncStatus: status,
          lastSyncAt: new Date(),
          transactionsImported: totalSynced || 0,
          lastCursor,
          errors: errorMessage ? { error: errorMessage } : null,
          highConfidenceCount: confidenceStats?.high || 0,
          mediumConfidenceCount: confidenceStats?.medium || 0,
          lowConfidenceCount: confidenceStats?.low || 0,
        }
      });
    } catch (error) {
      console.error('[Zerion] Failed to update sync status:', error);
    }
  }

  /**
   * Get sync status for a wallet
   */
  static async getSyncStatus(walletId: string) {
    try {
      return await prisma.zerionSyncStatus.findUnique({
        where: { walletId },
        include: {
          wallet: {
            select: {
              address: true,
              label: true
            }
          }
        }
      });
    } catch (error) {
      console.error('[Zerion] Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Test connection to Zerion API
   */
  async testConnection(): Promise<boolean> {
    return await this.client.testConnection();
  }

  /**
   * Get transaction count for a wallet without downloading all data
   */
  async getTransactionCount(walletAddress: string): Promise<number> {
    try {
      const response = await this.client.fetchTransactions(walletAddress, { pageSize: 1 });
      return response.meta?.total_count || 0;
    } catch (error) {
      console.error('[Zerion] Failed to get transaction count:', error);
      return 0;
    }
  }

  /**
   * Estimate sync time based on transaction count
   */
  async estimateSyncTime(walletAddress: string): Promise<{
    transactionCount: number;
    estimatedMinutes: number;
    estimatedPages: number;
  }> {
    const transactionCount = await this.getTransactionCount(walletAddress);
    const transactionsPerPage = 100;
    const secondsPerPage = 2; // Including rate limiting delays
    
    const estimatedPages = Math.ceil(transactionCount / transactionsPerPage);
    const estimatedMinutes = Math.ceil((estimatedPages * secondsPerPage) / 60);

    return {
      transactionCount,
      estimatedMinutes,
      estimatedPages
    };
  }
}