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