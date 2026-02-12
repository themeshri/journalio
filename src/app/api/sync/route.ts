import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { SyncScheduler } from '@/lib/scheduler';
import { z } from 'zod';

const syncRequestSchema = z.object({
  walletId: z.string().optional(),
  all: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();

    const body = await request.json();
    const { walletId, all } = syncRequestSchema.parse(body);

    if (walletId) {
      // Sync specific wallet
      const result = await SyncScheduler.triggerWalletSync(walletId);
      
      if (result.success) {
        return NextResponse.json({ 
          message: 'Sync started',
          jobId: result.jobId 
        });
      } else {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 400 });
      }
    } else if (all) {
      // Get user's wallets that need sync
      const walletStatus = await SyncScheduler.getUserWalletSyncStatus(userId);
      const walletsNeedingSync = walletStatus.filter(w => w.needsSync);

      const results = [];
      
      for (const wallet of walletsNeedingSync) {
        const result = await SyncScheduler.triggerWalletSync(wallet.walletId);
        results.push({
          walletId: wallet.walletId,
          address: wallet.address,
          ...result
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return NextResponse.json({
        message: `Sync started for ${walletsNeedingSync.length} wallets`,
        results
      });
    } else {
      return NextResponse.json({ 
        error: 'Must specify walletId or all=true' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      { error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();

    // Get sync status for user's wallets
    const walletStatus = await SyncScheduler.getUserWalletSyncStatus(userId);
    const stats = await SyncScheduler.getSyncStats();

    return NextResponse.json({
      wallets: walletStatus,
      stats
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}