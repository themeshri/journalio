import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/analytics';
import { z } from 'zod';

const positionsQuerySchema = z.object({
  walletId: z.string().optional(),
  walletAddress: z.string().optional(),
  symbol: z.string().optional(),
  status: z.enum(['open', 'closed']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minPnL: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPnL: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  view: z.enum(['summary', 'detailed']).optional().default('detailed')
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = positionsQuerySchema.parse(query);

    // Get user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: { id: true, address: true }
    });

    if (userWallets.length === 0) {
      return NextResponse.json({
        positions: [],
        positionMetrics: {
          totalPositions: 0,
          openPositions: 0,
          closedPositions: 0,
          totalRealizedPnL: 0,
          totalUnrealizedPnL: 0,
          totalNetPnL: 0,
          positionWinRate: 0,
          avgPositionDuration: 0,
          avgPositionSize: 0,
          largestWin: 0,
          largestLoss: 0,
          totalFees: 0
        }
      });
    }

    // Create position filters from query parameters
    const positionFilters: any = {};
    
    if (validatedQuery.walletAddress) {
      positionFilters.walletAddress = validatedQuery.walletAddress;
    }
    if (validatedQuery.status) {
      positionFilters.status = validatedQuery.status;
    }
    if (validatedQuery.startDate) {
      positionFilters.startDate = new Date(validatedQuery.startDate);
    }
    if (validatedQuery.endDate) {
      positionFilters.endDate = new Date(validatedQuery.endDate);
    }
    if (validatedQuery.minPnL !== undefined) {
      positionFilters.minPnL = validatedQuery.minPnL;
    }
    if (validatedQuery.maxPnL !== undefined) {
      positionFilters.maxPnL = validatedQuery.maxPnL;
    }
    if (validatedQuery.limit !== undefined) {
      positionFilters.limit = validatedQuery.limit;
    }
    if (validatedQuery.offset !== undefined) {
      positionFilters.offset = validatedQuery.offset;
    }

    // Handle summary view
    if (validatedQuery.view === 'summary') {
      if (validatedQuery.walletId) {
        // Verify wallet belongs to user
        const wallet = await prisma.wallet.findFirst({
          where: { id: validatedQuery.walletId, userId }
        });

        if (!wallet) {
          return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        const summaries = await analyticsService.getPositionSummaries(validatedQuery.walletId);
        return NextResponse.json({ positionSummaries: summaries });
      } else {
        // Combined summaries across all wallets
        const allSummaries = await Promise.all(
          userWallets.map(wallet => analyticsService.getPositionSummaries(wallet.id))
        );

        // Combine summaries by symbol
        const combinedSummaries = new Map();
        
        allSummaries.flat().forEach(summary => {
          if (combinedSummaries.has(summary.symbol)) {
            const existing = combinedSummaries.get(summary.symbol);
            existing.totalPositions += summary.totalPositions;
            existing.openPositions += summary.openPositions;
            existing.totalRealizedPnL += summary.totalRealizedPnL;
            existing.totalUnrealizedPnL += summary.totalUnrealizedPnL;
            existing.totalVolume += summary.totalVolume;
            
            // Weighted average for win rate and duration
            const totalClosedOld = existing.totalPositions - existing.openPositions;
            const totalClosedNew = summary.totalPositions - summary.openPositions;
            const totalClosedCombined = totalClosedOld + totalClosedNew;
            
            if (totalClosedCombined > 0) {
              existing.winRate = (existing.winRate * totalClosedOld + summary.winRate * totalClosedNew) / totalClosedCombined;
              existing.avgDuration = (existing.avgDuration * totalClosedOld + summary.avgDuration * totalClosedNew) / totalClosedCombined;
            }
          } else {
            combinedSummaries.set(summary.symbol, { ...summary });
          }
        });

        return NextResponse.json({ 
          positionSummaries: Array.from(combinedSummaries.values())
            .sort((a, b) => (b.totalRealizedPnL + b.totalUnrealizedPnL) - (a.totalRealizedPnL + a.totalUnrealizedPnL))
        });
      }
    }

    // Handle detailed view
    if (validatedQuery.walletId) {
      // Verify wallet belongs to user
      const wallet = await prisma.wallet.findFirst({
        where: { id: validatedQuery.walletId, userId }
      });

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      // Get positions and metrics for specific wallet
      let positions;
      if (validatedQuery.symbol) {
        positions = await analyticsService.getPositionsBySymbol(validatedQuery.walletId, validatedQuery.symbol, positionFilters);
      } else {
        positions = await analyticsService.getOpenPositions(validatedQuery.walletId);
        if (!validatedQuery.status || validatedQuery.status === 'closed') {
          const closedPositions = await analyticsService.getClosedPositions(validatedQuery.walletId, positionFilters);
          if (validatedQuery.status !== 'open') {
            positions = [...positions, ...closedPositions];
          }
        }
      }

      const metrics = await analyticsService.getPositionMetrics(validatedQuery.walletId, positionFilters);

      return NextResponse.json({
        positions,
        positionMetrics: metrics,
        walletAddress: wallet.address
      });
    } else {
      // Calculate combined positions across all wallets
      const allPositions = [];
      const allMetrics = [];

      for (const wallet of userWallets) {
        let walletPositions;
        if (validatedQuery.symbol) {
          walletPositions = await analyticsService.getPositionsBySymbol(wallet.id, validatedQuery.symbol, positionFilters);
        } else {
          const openPositions = await analyticsService.getOpenPositions(wallet.id);
          if (!validatedQuery.status || validatedQuery.status === 'closed') {
            const closedPositions = await analyticsService.getClosedPositions(wallet.id, positionFilters);
            walletPositions = validatedQuery.status === 'open' ? openPositions : [...openPositions, ...closedPositions];
          } else {
            walletPositions = openPositions;
          }
        }

        const walletMetrics = await analyticsService.getPositionMetrics(wallet.id, positionFilters);
        
        allPositions.push(...walletPositions);
        allMetrics.push(walletMetrics);
      }

      // Combine metrics
      const combinedMetrics = allMetrics.reduce(
        (acc, metrics) => ({
          totalPositions: acc.totalPositions + metrics.totalPositions,
          openPositions: acc.openPositions + metrics.openPositions,
          closedPositions: acc.closedPositions + metrics.closedPositions,
          totalRealizedPnL: acc.totalRealizedPnL + metrics.totalRealizedPnL,
          totalUnrealizedPnL: acc.totalUnrealizedPnL + metrics.totalUnrealizedPnL,
          totalNetPnL: acc.totalNetPnL + metrics.totalNetPnL,
          positionWinRate: 0, // Calculate after reduction
          avgPositionDuration: 0, // Calculate after reduction
          avgPositionSize: 0, // Calculate after reduction
          largestWin: Math.max(acc.largestWin, metrics.largestWin),
          largestLoss: Math.min(acc.largestLoss, metrics.largestLoss),
          totalFees: acc.totalFees + metrics.totalFees
        }),
        {
          totalPositions: 0,
          openPositions: 0,
          closedPositions: 0,
          totalRealizedPnL: 0,
          totalUnrealizedPnL: 0,
          totalNetPnL: 0,
          positionWinRate: 0,
          avgPositionDuration: 0,
          avgPositionSize: 0,
          largestWin: 0,
          largestLoss: 0,
          totalFees: 0
        }
      );

      // Calculate weighted averages
      if (combinedMetrics.closedPositions > 0) {
        const totalDuration = allMetrics.reduce((sum, m) => sum + (m.avgPositionDuration * m.closedPositions), 0);
        combinedMetrics.avgPositionDuration = totalDuration / combinedMetrics.closedPositions;

        const profitablePositions = allMetrics.reduce((sum, m) => sum + (m.positionWinRate / 100 * m.closedPositions), 0);
        combinedMetrics.positionWinRate = (profitablePositions / combinedMetrics.closedPositions) * 100;
      }

      if (combinedMetrics.totalPositions > 0) {
        const totalSize = allMetrics.reduce((sum, m) => sum + (m.avgPositionSize * m.totalPositions), 0);
        combinedMetrics.avgPositionSize = totalSize / combinedMetrics.totalPositions;
      }

      // Sort positions by most recent first
      allPositions.sort((a, b) => b.openDate.getTime() - a.openDate.getTime());

      // Apply limit and offset if specified
      let paginatedPositions = allPositions;
      if (validatedQuery.offset || validatedQuery.limit) {
        const start = validatedQuery.offset || 0;
        const end = validatedQuery.limit ? start + validatedQuery.limit : undefined;
        paginatedPositions = allPositions.slice(start, end);
      }

      return NextResponse.json({
        positions: paginatedPositions,
        positionMetrics: combinedMetrics,
        total: allPositions.length
      });
    }

  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position data' },
      { status: 500 }
    );
  }
}