import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const tradesQuerySchema = z.object({
  walletId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tokenAddress: z.string().optional(),
  tradeType: z.enum(['buy', 'sell', 'swap']).optional(),
  pnlType: z.enum(['profit', 'loss', 'all']).optional(),
  dex: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = tradesQuerySchema.parse(query);

    // Get user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: { id: true }
    });

    if (userWallets.length === 0) {
      return NextResponse.json({ trades: [], total: 0 });
    }

    // Build where condition
    const whereCondition: any = {
      walletId: {
        in: validatedQuery.walletId ? [validatedQuery.walletId] : userWallets.map(w => w.id)
      },
      processed: true
    };

    // Apply filters
    if (validatedQuery.tokenAddress) {
      whereCondition.OR = [
        { tokenIn: validatedQuery.tokenAddress },
        { tokenOut: validatedQuery.tokenAddress }
      ];
    }
    
    if (validatedQuery.startDate && validatedQuery.endDate) {
      whereCondition.blockTime = {
        gte: new Date(validatedQuery.startDate),
        lte: new Date(validatedQuery.endDate)
      };
    }
    
    if (validatedQuery.tradeType) {
      whereCondition.type = validatedQuery.tradeType;
    }
    
    if (validatedQuery.dex) {
      whereCondition.dex = validatedQuery.dex;
    }

    // Verify wallet belongs to user if specified
    if (validatedQuery.walletId) {
      const wallet = await prisma.wallet.findFirst({
        where: { id: validatedQuery.walletId, userId }
      });

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
    }

    // Get total count
    const total = await prisma.trade.count({ where: whereCondition });

    // Parse pagination
    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit) : 50;
    const offset = validatedQuery.offset ? parseInt(validatedQuery.offset) : 0;

    // Get trades with pagination
    const trades = await prisma.trade.findMany({
      where: whereCondition,
      orderBy: { blockTime: 'desc' },
      take: Math.min(limit, 100), // Max 100 per request
      skip: offset,
      select: {
        id: true,
        signature: true,
        type: true,
        tokenIn: true,
        tokenOut: true,
        amountIn: true,
        amountOut: true,
        priceIn: true,
        priceOut: true,
        dex: true,
        fees: true,
        blockTime: true,
        processed: true,
        error: true
      }
    });

    return NextResponse.json({ 
      trades, 
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Analytics trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}