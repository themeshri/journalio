import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/analytics';
import { z } from 'zod';

const metricsQuerySchema = z.object({
  walletId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tokenAddress: z.string().optional(),
  tradeType: z.enum(['buy', 'sell', 'swap']).optional(),
  pnlType: z.enum(['profit', 'loss', 'all']).optional(),
  dex: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = metricsQuerySchema.parse(query);

    // Get user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: { id: true }
    });

    if (userWallets.length === 0) {
      return NextResponse.json({
        totalPnL: 0,
        totalVolume: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        biggestWin: 0,
        biggestLoss: 0,
        profitFactor: 0,
        avgHoldTime: 0
      });
    }

    // Create filters from query parameters
    const filters: any = {};
    
    if (validatedQuery.startDate) {
      filters.startDate = new Date(validatedQuery.startDate);
    }
    if (validatedQuery.endDate) {
      filters.endDate = new Date(validatedQuery.endDate);
    }
    if (validatedQuery.tokenAddress) {
      filters.tokenAddress = validatedQuery.tokenAddress;
    }
    if (validatedQuery.tradeType) {
      filters.tradeType = validatedQuery.tradeType;
    }
    if (validatedQuery.pnlType) {
      filters.pnlType = validatedQuery.pnlType;
    }
    if (validatedQuery.dex) {
      filters.dex = validatedQuery.dex;
    }

    // Calculate metrics for specific wallet or all wallets
    if (validatedQuery.walletId) {
      // Verify wallet belongs to user
      const wallet = await prisma.wallet.findFirst({
        where: { id: validatedQuery.walletId, userId }
      });

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      const metrics = await analyticsService.calculateWalletMetrics(validatedQuery.walletId, filters);
      return NextResponse.json(metrics);
    } else {
      // Calculate combined metrics across all wallets
      const allMetrics = await Promise.all(
        userWallets.map(wallet => analyticsService.calculateWalletMetrics(wallet.id, filters))
      );

      const combinedMetrics = allMetrics.reduce(
        (acc, metrics) => ({
          totalPnL: acc.totalPnL + metrics.totalPnL,
          totalVolume: acc.totalVolume + metrics.totalVolume,
          totalTrades: acc.totalTrades + metrics.totalTrades,
          winningTrades: acc.winningTrades + metrics.winningTrades,
          losingTrades: acc.losingTrades + metrics.losingTrades,
          winRate: 0, // Calculate after reduction
          avgWin: 0, // Calculate after reduction
          avgLoss: 0, // Calculate after reduction
          biggestWin: Math.max(acc.biggestWin, metrics.biggestWin),
          biggestLoss: Math.min(acc.biggestLoss, metrics.biggestLoss),
          profitFactor: 0, // Calculate after reduction
          avgHoldTime: 0
        }),
        {
          totalPnL: 0,
          totalVolume: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          biggestWin: 0,
          biggestLoss: 0,
          profitFactor: 0,
          avgHoldTime: 0
        }
      );

      // Calculate derived metrics
      const totalPnlTrades = combinedMetrics.winningTrades + combinedMetrics.losingTrades;
      combinedMetrics.winRate = totalPnlTrades > 0 ? (combinedMetrics.winningTrades / totalPnlTrades) * 100 : 0;

      return NextResponse.json(combinedMetrics);
    }

  } catch (error) {
    console.error('Analytics metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}