import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/analytics';
import { MetricsOverview } from '@/components/analytics/metrics-overview';
import { PnLChart } from '@/components/analytics/pnl-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const userId = await requireAuth();

  // Get user's wallets
  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true }
  });

  if (wallets.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Analytics Available</h2>
        <p className="text-muted-foreground mb-6">
          Add wallet addresses and import trades to see your analytics
        </p>
      </div>
    );
  }

  // Calculate combined metrics across all wallets
  const allMetrics = await Promise.all(
    wallets.map(wallet => analyticsService.calculateWalletMetrics(wallet.id))
  );

  // Combine metrics from all wallets
  const combinedMetrics = allMetrics.reduce(
    (acc, metrics) => ({
      totalPnL: acc.totalPnL + metrics.totalPnL,
      totalVolume: acc.totalVolume + metrics.totalVolume,
      totalTrades: acc.totalTrades + metrics.totalTrades,
      winningTrades: acc.winningTrades + metrics.winningTrades,
      losingTrades: acc.losingTrades + metrics.losingTrades,
      winRate: 0, // Will calculate after reduction
      avgWin: 0, // Will calculate after reduction
      avgLoss: 0, // Will calculate after reduction
      biggestWin: Math.max(acc.biggestWin, metrics.biggestWin),
      biggestLoss: Math.min(acc.biggestLoss, metrics.biggestLoss),
      profitFactor: 0, // Will calculate after reduction
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

  // Calculate profit factor and average win/loss
  const totalWinAmount = allMetrics.reduce((sum, m) => sum + (m.avgWin * m.winningTrades), 0);
  const totalLossAmount = allMetrics.reduce((sum, m) => sum + (m.avgLoss * m.losingTrades), 0);
  
  combinedMetrics.avgWin = combinedMetrics.winningTrades > 0 ? totalWinAmount / combinedMetrics.winningTrades : 0;
  combinedMetrics.avgLoss = combinedMetrics.losingTrades > 0 ? totalLossAmount / combinedMetrics.losingTrades : 0;
  combinedMetrics.profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 1 : 0;

  // Get P&L breakdown for the first wallet (combined view will be enhanced in Phase 2)
  const pnlBreakdown = await analyticsService.calculatePnLBreakdown(wallets[0].id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-sm text-muted-foreground">
          Data from {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
        </div>
      </div>

      <MetricsOverview metrics={combinedMetrics} />

      <div className="grid gap-4 md:grid-cols-2">
        <PnLChart data={pnlBreakdown.daily} />
        
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tokens</CardTitle>
            <CardDescription>Best tokens by P&L</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Token performance analysis coming in Phase 2
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}