import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ZerionSyncService } from '@/services/zerion/zerion-sync-service';

/**
 * Test Zerion API connection and estimate sync time for a wallet
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if Zerion API key is configured
    if (!process.env.ZERION_API_KEY || process.env.ZERION_API_KEY === 'your-zerion-api-key-here') {
      return NextResponse.json({
        success: false,
        error: 'Zerion API key not configured. Please add ZERION_API_KEY to your environment variables.',
        configured: false
      });
    }

    const syncService = new ZerionSyncService();

    // Test connection
    const connectionTest = await syncService.testConnection();
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Zerion API. Please check your API key and network connectivity.',
        configured: true,
        connected: false
      });
    }

    // Get wallet stats and estimate sync time
    const estimate = await syncService.estimateSyncTime(walletAddress);

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      walletAddress,
      transactionCount: estimate.transactionCount,
      estimatedPages: estimate.estimatedPages,
      estimatedMinutes: estimate.estimatedMinutes,
      pageLimit: process.env.ZERION_SYNC_PAGE_LIMIT || '10',
      recommendation: estimate.transactionCount > 1000 
        ? 'Large wallet detected. Consider using page limit or date range sync to avoid long processing times.'
        : estimate.transactionCount > 100
        ? 'Medium size wallet. Full sync should complete in a reasonable time.'
        : 'Small wallet. Full sync will be quick.',
      message: `Found ${estimate.transactionCount} transactions. Estimated sync time: ${estimate.estimatedMinutes} minutes.`
    });

  } catch (error) {
    console.error('Zerion test error:', error);
    return NextResponse.json({
      success: false,
      configured: !!process.env.ZERION_API_KEY,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Please check your Zerion API key and network connectivity.'
    }, { status: 500 });
  }
}

/**
 * Test Zerion API with a simple request
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { walletAddress, pageSize = 5 } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const syncService = new ZerionSyncService();
    
    // Test with a small sample of transactions
    const client = syncService['client']; // Access private client
    const response = await client.fetchTransactions(walletAddress, {
      pageSize,
      chainIds: ['solana']
    });

    const transactions = response.data || [];

    return NextResponse.json({
      success: true,
      sampleSize: transactions.length,
      totalAvailable: response.meta?.total_count || 'unknown',
      sampleTransactions: transactions.map(tx => ({
        id: tx.id,
        hash: tx.attributes.hash,
        operationType: tx.attributes.operation_type,
        timestamp: tx.attributes.mined_at,
        status: tx.attributes.status,
        transferCount: tx.attributes.transfers?.length || 0,
        hasValue: !!tx.attributes.value
      })),
      message: `Successfully fetched ${transactions.length} sample transactions`
    });

  } catch (error) {
    console.error('Zerion sample test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sample data',
      configured: !!process.env.ZERION_API_KEY
    }, { status: 500 });
  }
}