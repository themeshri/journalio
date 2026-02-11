import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  try {
    const { userId } = await auth();
    const { walletId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Get failed trades for this wallet
    const failedTrades = await prisma.trade.findMany({
      where: {
        walletId,
        processed: false,
        error: { not: null }
      },
      orderBy: { blockTime: 'desc' },
      take: 50 // Limit to recent failures
    });

    const errors = failedTrades.map(trade => ({
      id: trade.id,
      signature: trade.signature,
      blockTime: trade.blockTime,
      dex: trade.dex || 'unknown',
      error: trade.error || 'Unknown error',
      fees: trade.fees.toString()
    }));

    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Get wallet errors:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet errors' },
      { status: 500 }
    );
  }
}