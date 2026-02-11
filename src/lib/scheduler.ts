import { prisma } from './db';

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

  /**
   * Get sync status for all wallets for a user
   */
  static async getUserWalletSyncStatus(userId: string): Promise<Array<{
    walletId: string;
    address: string;
    lastSync: Date;
    nextSync: Date;
    needsSync: boolean;
  }>> {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId, isActive: true },
        select: { id: true, address: true, updatedAt: true }
      });

      return wallets.map(wallet => {
        const nextSync = new Date(wallet.updatedAt);
        nextSync.setHours(nextSync.getHours() + 24);
        
        return {
          walletId: wallet.id,
          address: wallet.address,
          lastSync: wallet.updatedAt,
          nextSync,
          needsSync: nextSync <= new Date()
        };
      });
    } catch (error) {
      console.error(`Failed to get user wallet sync status:`, error);
      return [];
    }
  }

  /**
   * Manually trigger sync for a specific wallet
   */
  static async triggerWalletSync(walletId: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const { tradeImportService } = await import('./trade-import-service');
      
      // Check if there's already an active import job
      const existingJob = await prisma.importJob.findFirst({
        where: {
          walletId,
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      });

      if (existingJob) {
        return {
          success: false,
          error: 'Import already in progress'
        };
      }

      const jobId = await tradeImportService.startImport(walletId);
      await this.scheduleWalletSync(walletId);

      return {
        success: true,
        jobId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get statistics about sync activity
   */
  static async getSyncStats(): Promise<{
    totalWallets: number;
    walletsNeedingSync: number;
    activeJobs: number;
    completedJobsToday: number;
    failedJobsToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalWallets,
        walletsNeedingSync,
        activeJobs,
        completedJobsToday,
        failedJobsToday
      ] = await Promise.all([
        prisma.wallet.count({ where: { isActive: true } }),
        prisma.wallet.count({
          where: {
            isActive: true,
            updatedAt: { lt: new Date(Date.now() - 23 * 60 * 60 * 1000) }
          }
        }),
        prisma.importJob.count({
          where: { status: { in: ['PENDING', 'PROCESSING'] } }
        }),
        prisma.importJob.count({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: today }
          }
        }),
        prisma.importJob.count({
          where: {
            status: 'FAILED',
            startedAt: { gte: today }
          }
        })
      ]);

      return {
        totalWallets,
        walletsNeedingSync,
        activeJobs,
        completedJobsToday,
        failedJobsToday
      };
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return {
        totalWallets: 0,
        walletsNeedingSync: 0,
        activeJobs: 0,
        completedJobsToday: 0,
        failedJobsToday: 0
      };
    }
  }
}