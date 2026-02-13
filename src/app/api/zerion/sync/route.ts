import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ZerionSyncService } from '@/services/zerion/zerion-sync-service';

/**
 * Trigger Zerion sync for a wallet
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { walletId, walletAddress, syncType = '24h', pageLimit } = await req.json();

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

    // Check if Zerion API key is configured
    if (!process.env.ZERION_API_KEY || process.env.ZERION_API_KEY === 'your-zerion-api-key-here') {
      return NextResponse.json({
        success: false,
        error: 'Zerion API key not configured. Please add ZERION_API_KEY to your environment variables.'
      }, { status: 500 });
    }

    // Check if Zerion sync is enabled
    if (process.env.ENABLE_ZERION_SYNC === 'false') {
      return NextResponse.json({
        success: false,
        error: 'Zerion sync is disabled. Set ENABLE_ZERION_SYNC=true in your environment variables.'
      }, { status: 400 });
    }

    // Initialize sync service
    const syncService = new ZerionSyncService();

    // Test connection first
    const connectionTest = await syncService.testConnection();
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Zerion API. Please check your API key and network connectivity.'
      }, { status: 500 });
    }

    // Perform sync based on type
    let result;
    if (syncType === '24h') {
      result = await syncService.sync24Hours(walletAddress, walletId);
    } else if (syncType === 'custom') {
      const { startDate, endDate } = await req.json();
      result = await syncService.syncDateRange(
        walletAddress,
        walletId,
        new Date(startDate),
        new Date(endDate)
      );
    } else if (syncType === 'all') {
      result = await syncService.syncAllTransactions(
        walletAddress,
        walletId,
        { pageLimit: pageLimit || parseInt(process.env.ZERION_SYNC_PAGE_LIMIT || '10') }
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
      confidence: {
        high: result.highConfidence,
        medium: result.mediumConfidence,
        low: result.lowConfidence
      },
      message: result.success 
        ? `Successfully synced ${result.totalSaved} new transactions (${result.highConfidence} high confidence, ${result.mediumConfidence} medium, ${result.lowConfidence} low)`
        : 'Sync failed. Please check the errors and try again.'
    });

  } catch (error) {
    console.error('Zerion sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const syncStatus = await ZerionSyncService.getSyncStatus(walletId);

    if (!syncStatus) {
      return NextResponse.json({
        status: 'never_synced',
        lastSyncAt: null,
        transactionsImported: 0,
        confidence: {
          high: 0,
          medium: 0,
          low: 0
        },
        message: 'This wallet has never been synced with Zerion'
      });
    }

    return NextResponse.json({
      id: syncStatus.id,
      walletId: syncStatus.walletId,
      syncStatus: syncStatus.syncStatus,
      lastSyncAt: syncStatus.lastSyncAt,
      transactionsImported: syncStatus.transactionsImported,
      confidence: {
        high: syncStatus.highConfidenceCount,
        medium: syncStatus.mediumConfidenceCount,
        low: syncStatus.lowConfidenceCount
      },
      errors: syncStatus.errors,
      lastFetchDuration: syncStatus.lastFetchDuration,
      apiCallCount: syncStatus.apiCallCount,
      createdAt: syncStatus.createdAt,
      updatedAt: syncStatus.updatedAt,
      wallet: syncStatus.wallet
    });

  } catch (error) {
    console.error('Get Zerion sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}