import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch all trades for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();

    // First ensure user has a wallet
    let wallet = await prisma.wallet.findFirst({
      where: { userId }
    });

    if (!wallet) {
      // Create a default wallet
      wallet = await prisma.wallet.create({
        data: {
          address: '7xKXtg2CW87d7TXQ4q6Zqm2Z7Xqr4q5X4q5X4q5X4q5X',
          label: 'Main Trading Wallet',
          chain: 'SOLANA',
          isActive: true,
          userId
        }
      });
    }



    // Fetch trades with mistake information
    const trades = await prisma.trade.findMany({
      where: { wallet: { userId } },
      include: {
        wallet: true,
        mistakes: true
      },
      orderBy: { blockTime: 'desc' }
    });

    // Transform the response
    const transformedTrades = trades.map(trade => ({
      ...trade,
      amountIn: trade.amountIn.toNumber(),
      amountOut: trade.amountOut.toNumber(),
      priceIn: trade.priceIn?.toNumber(),
      priceOut: trade.priceOut?.toNumber(),
      fees: trade.fees.toNumber(),
      mistakes: trade.mistakes
    }));

    return NextResponse.json({ trades: transformedTrades });
  } catch (error) {
    console.error('GET /api/trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new trade
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();

    const body = await request.json();
    
    // Create the trade
    const trade = await prisma.trade.create({
      data: {
        ...body,
        userId,
        isManual: true
      },
      include: {
        mistakes: true
      }
    });

    // Transform the response
    const transformedTrade = {
      ...trade,
      amountIn: trade.amountIn.toNumber(),
      amountOut: trade.amountOut.toNumber(),
      priceIn: trade.priceIn?.toNumber(),
      priceOut: trade.priceOut?.toNumber(),
      fees: trade.fees.toNumber(),
      mistakes: trade.mistakes
    };

    return NextResponse.json({ trade: transformedTrade }, { status: 201 });
  } catch (error) {
    console.error('POST /api/trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}