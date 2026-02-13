import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ZerionSyncService } from '@/services/zerion/zerion-sync-service';

/**
 * Provider-specific sync endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { 
      walletId, 
      walletAddress, 
      provider = process.env.DEFAULT_SYNC_PROVIDER || 'zerion',
      syncType = '24h',
      pageLimit
    } = await req.json();

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

    // Route to Zerion (only provider)
    if (provider === 'zerion' || !provider) {
      return handleZerionSync(walletId, walletAddress, syncType, pageLimit);
    } else {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}. Only 'zerion' is supported` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Provider sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    );
  }
}

async function handleZerionSync(
  walletId: string, 
  walletAddress: string, 
  syncType: string, 
  pageLimit?: number
) {
  // Check if Zerion is enabled and configured
  if (process.env.ENABLE_ZERION_SYNC === 'false') {
    return NextResponse.json({
      success: false,
      provider: 'zerion',
      error: 'Zerion sync is disabled'
    }, { status: 400 });
  }

  if (!process.env.ZERION_API_KEY) {
    return NextResponse.json({
      success: false,
      provider: 'zerion',
      error: 'Zerion API key not configured'
    }, { status: 500 });
  }

  const syncService = new ZerionSyncService();
  
  let result;
  if (syncType === '24h') {
    result = await syncService.sync24Hours(walletAddress, walletId);
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
    provider: 'zerion',
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
      ? `Zerion sync completed: ${result.totalSaved} new transactions`
      : 'Zerion sync failed'
  });
}


/**
 * Get available providers and their status
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const providers = {
      zerion: {
        available: !!process.env.ZERION_API_KEY,
        enabled: process.env.ENABLE_ZERION_SYNC !== 'false',
        configured: !!process.env.ZERION_API_KEY && process.env.ZERION_API_KEY !== 'your-zerion-api-key-here',
        features: ['24h sync', 'full sync', 'confidence scoring', 'rich metadata', 'cross-copy price logic'],
        description: 'Primary transaction history provider with superior data quality'
      }
    };

    const defaultProvider = 'zerion';
    const recommendedProvider = providers.zerion.configured ? 'zerion' : null;

    return NextResponse.json({
      providers,
      defaultProvider,
      recommendedProvider,
      recommendation: recommendedProvider === 'zerion' 
        ? 'Zerion provides comprehensive transaction data and superior price coverage'
        : 'Zerion provider is not properly configured'
    });

  } catch (error) {
    console.error('Get sync providers error:', error);
    return NextResponse.json(
      { error: 'Failed to get provider status' },
      { status: 500 }
    );
  }
}