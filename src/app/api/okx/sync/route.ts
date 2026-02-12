import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OKXSyncService } from '@/services/okx/okx-sync-service';

/**
 * Trigger OKX sync for a wallet
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { walletId, walletAddress, syncType = '24h' } = await req.json();

    // Validate input
    if (!walletId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing wallet information' },
        { status: 400 }
      );
    }

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId,
        address: walletAddress
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or access denied' },
        { status: 404 }
      );
    }

    // Check if OKX API credentials are configured in environment
    if (!process.env.OKX_API_KEY || !process.env.OKX_SECRET_KEY || !process.env.OKX_PASSPHRASE ||
        process.env.OKX_API_KEY === 'your-okx-api-key-here' ||
        process.env.OKX_SECRET_KEY === 'your-okx-secret-key-here' ||
        process.env.OKX_PASSPHRASE === 'your-okx-passphrase-here') {
      
      // Return a mock success for testing when credentials aren't configured
      return NextResponse.json({
        success: true,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: [],
        message: '🔧 OKX API credentials not configured. Add your real OKX API credentials to .env.local to fetch actual transactions.\n\nSet:\nOKX_API_KEY=your-real-api-key\nOKX_SECRET_KEY=your-real-secret-key\nOKX_PASSPHRASE=your-real-passphrase'
      });
    }

    // Initialize sync service (uses environment variables)
    const syncService = new OKXSyncService();

    // Perform sync based on type
    let result;
    if (syncType === '24h') {
      result = await syncService.sync24Hours(walletAddress, walletId);
    } else if (syncType === 'custom' && req.body) {
      const body = await req.json();
      const { startDate, endDate } = body;
      result = await syncService.syncDateRange(
        walletAddress,
        walletId,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      result = await syncService.sync24Hours(walletAddress, walletId);
    }

    return NextResponse.json({
      success: result.success,
      totalFetched: result.totalFetched,
      totalSaved: result.totalSaved,
      duplicates: result.duplicates,
      errors: result.errors,
      message: result.success 
        ? `Successfully synced ${result.totalSaved} new transactions`
        : 'Sync failed. Please check the errors and try again.'
    });

  } catch (error) {
    console.error('OKX sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    );
  }
}

/**
 * Get sync status for a wallet
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or access denied' },
        { status: 404 }
      );
    }

    // Get sync status
    const syncStatus = await OKXSyncService.getSyncStatus(walletId);

    if (!syncStatus) {
      return NextResponse.json({
        status: 'never_synced',
        lastSyncTime: null,
        totalSynced: 0,
        message: 'This wallet has never been synced with OKX'
      });
    }

    return NextResponse.json({
      status: syncStatus.status,
      lastSyncTime: syncStatus.lastSyncTime,
      totalSynced: syncStatus.totalSynced,
      errorMessage: syncStatus.errorMessage,
      createdAt: syncStatus.createdAt,
      updatedAt: syncStatus.updatedAt
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}