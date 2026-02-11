import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CombinedDashboardProps {
  wallets: Array<{
    id: string;
    address: string;
    chain: string;
    label?: string;
    _count?: {
      trades: number;
    };
  }>;
}

export function CombinedDashboard({ wallets }: CombinedDashboardProps) {
  const totalWallets = wallets.length;
  const totalTrades = wallets.reduce((sum, wallet) => sum + (wallet._count?.trades ?? 0), 0);
  const activeWallets = wallets.filter(wallet => (wallet._count?.trades ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Portfolio Overview</h2>
        <span className="text-sm text-muted-foreground">
          Combined data across all wallets
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWallets}</div>
            <p className="text-xs text-muted-foreground">
              {activeWallets} with trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              Across all wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">
              Available after imports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Activity</CardTitle>
          <CardDescription>Combined trading activity across all wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg mb-2">No trading data yet</p>
            <p className="text-sm">
              Trade import will be available in the next phase to populate this dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}