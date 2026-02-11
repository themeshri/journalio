import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/analytics';
import { PositionOverview } from '@/components/analytics/position-overview';
import { PositionsTable } from '@/components/analytics/positions-table';

export default async function PositionsPage() {
  const userId = await requireAuth();

  // Get user's wallets
  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true }
  });

  if (wallets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
          <p className="text-muted-foreground">
            Track your trading positions with FIFO cost basis calculation
          </p>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Positions Available</h2>
          <p className="text-muted-foreground mb-6">
            Add wallet addresses and import trades to see your position tracking
          </p>
        </div>
      </div>
    );
  }

  // Calculate combined position metrics across all wallets
  const allPositionMetrics = await Promise.all(
    wallets.map(wallet => analyticsService.getPositionMetrics(wallet.id))
  );

  // Combine metrics from all wallets
  const combinedPositionMetrics = allPositionMetrics.reduce(
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

  // Calculate weighted averages for combined metrics
  if (combinedPositionMetrics.closedPositions > 0) {
    // Calculate weighted position win rate
    const totalProfitablePositions = allPositionMetrics.reduce(
      (sum, m) => sum + (m.positionWinRate / 100 * m.closedPositions), 0
    );
    combinedPositionMetrics.positionWinRate = 
      (totalProfitablePositions / combinedPositionMetrics.closedPositions) * 100;

    // Calculate weighted average duration
    const totalDuration = allPositionMetrics.reduce(
      (sum, m) => sum + (m.avgPositionDuration * m.closedPositions), 0
    );
    combinedPositionMetrics.avgPositionDuration = 
      totalDuration / combinedPositionMetrics.closedPositions;
  }

  if (combinedPositionMetrics.totalPositions > 0) {
    // Calculate weighted average position size
    const totalSize = allPositionMetrics.reduce(
      (sum, m) => sum + (m.avgPositionSize * m.totalPositions), 0
    );
    combinedPositionMetrics.avgPositionSize = 
      totalSize / combinedPositionMetrics.totalPositions;
  }

  // Get initial positions data for all wallets
  const allPositions = [];
  for (const wallet of wallets) {
    // Get both open and closed positions
    const openPositions = await analyticsService.getOpenPositions(wallet.id);
    const closedPositions = await analyticsService.getClosedPositions(wallet.id, {
      limit: 25 // Limit to recent closed positions for initial load
    });
    
    allPositions.push(...openPositions, ...closedPositions);
  }

  // Sort positions by most recent first (open date for open positions, close date for closed)
  allPositions.sort((a, b) => {
    const aDate = a.status === 'open' ? a.openDate : (a.closeDate || a.openDate);
    const bDate = b.status === 'open' ? b.openDate : (b.closeDate || b.openDate);
    return bDate.getTime() - aDate.getTime();
  });

  // Take first 50 positions for initial display
  const initialPositions = allPositions.slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
        <p className="text-muted-foreground">
          Track your trading positions with FIFO cost basis calculation
        </p>
      </div>

      {/* Position Metrics Overview */}
      <PositionOverview metrics={combinedPositionMetrics} />

      {/* Position Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
              <p className="text-2xl font-bold">{wallets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Tokens</p>
              <p className="text-2xl font-bold">
                {new Set(initialPositions.map(p => p.symbol)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Hold Time</p>
              <p className="text-2xl font-bold">
                {combinedPositionMetrics.avgPositionDuration < 1 
                  ? `${Math.round(combinedPositionMetrics.avgPositionDuration * 60)}m`
                  : combinedPositionMetrics.avgPositionDuration < 24 
                  ? `${Math.round(combinedPositionMetrics.avgPositionDuration)}h`
                  : `${Math.round(combinedPositionMetrics.avgPositionDuration / 24)}d`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <PositionsTable positions={initialPositions} />

      {/* Information Card */}
      <div className="rounded-lg border p-6 bg-muted/50">
        <h3 className="text-lg font-medium mb-2">Position Tracking</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Positions are calculated using First-In-First-Out (FIFO) methodology for IRS compliance.
            Trade grouping is done automatically based on token symbols and chronological order.
          </p>
          <p>
            <strong>Open Positions:</strong> Show unrealized P&L based on current market prices (when available).
          </p>
          <p>
            <strong>Closed Positions:</strong> Show realized P&L from completed buy/sell cycles.
          </p>
          <p>
            Position data is calculated in real-time from your imported trade history and may take a moment to load for large datasets.
          </p>
        </div>
      </div>
    </div>
  );
}