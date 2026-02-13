'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertCircle,
  Wallet,
  BarChart3,
  Clock,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

// Import our new UI components
import { MetricCard } from '@/components/ui/metric-card';
import { TradeCard } from '@/components/ui/trade-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
import { TradeMetrics } from '@/types/analytics';

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceIn?: number;
  priceOut?: number;
  executedAt: string;
  dex: string;
  fees: number;
  notes?: string;
  mistakes?: Array<{
    id: string;
    mistakeType: string;
    severity: string;
  }>;
}

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice?: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [tokenDistribution, setTokenDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load trades and metrics in parallel
      const [tradesResponse, metricsResponse] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/analytics/metrics')
      ]);

      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        const loadedTrades = tradesData.trades || [];
        setTrades(loadedTrades);
        
        // Generate chart data from trades
        generateChartData(loadedTrades);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Mock positions data
      setPositions([
        {
          id: '1',
          symbol: 'SOL',
          quantity: 125.5,
          avgEntryPrice: 142.50,
          currentPrice: 148.75,
          unrealizedPnL: 784.38,
          unrealizedPnLPercentage: 4.39
        },
        {
          id: '2',
          symbol: 'BONK',
          quantity: 5000000,
          avgEntryPrice: 0.000032,
          currentPrice: 0.000029,
          unrealizedPnL: -15.00,
          unrealizedPnLPercentage: -9.38
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateChartData = (trades: Trade[]) => {
    // Generate P&L chart data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        pnl: Math.random() * 2000 - 500,
        volume: Math.random() * 10000
      };
    });
    setChartData(last7Days);

    // Generate volume data
    const volumeByDex = [
      { dex: 'Jupiter', volume: 45000, trades: 120 },
      { dex: 'Raydium', volume: 32000, trades: 89 },
      { dex: 'Orca', volume: 28000, trades: 76 },
      { dex: 'Serum', volume: 15000, trades: 45 },
    ];
    setVolumeData(volumeByDex);

    // Generate token distribution
    const tokenDist = [
      { name: 'SOL', value: 35, amount: '$12,450' },
      { name: 'BONK', value: 20, amount: '$7,120' },
      { name: 'JTO', value: 15, amount: '$5,340' },
      { name: 'PYTH', value: 15, amount: '$5,340' },
      { name: 'Others', value: 15, amount: '$5,340' },
    ];
    setTokenDistribution(tokenDist);
  };

  // Calculate additional metrics
  const totalPnL = metrics?.totalPnL || 0;
  const winRate = metrics?.winRate || 0;
  const totalVolume = metrics?.totalVolume || 0;
  const totalTrades = metrics?.totalTrades || 0;
  const todayPnL = 1234.56; // Mock today's P&L
  const weekPnL = 5678.90; // Mock week's P&L

  // Define table columns for positions
  const positionColumns: Column<Position>[] = [
    {
      id: 'symbol',
      header: 'Token',
      accessor: (row) => row.symbol,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-white">
            {value.charAt(0)}
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessor: (row) => row.quantity,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'avgPrice',
      header: 'Avg Entry',
      accessor: (row) => row.avgEntryPrice,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">
          ${value.toFixed(4)}
        </span>
      ),
    },
    {
      id: 'currentPrice',
      header: 'Current',
      accessor: (row) => row.currentPrice,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">
          ${value?.toFixed(4) || '—'}
        </span>
      ),
    },
    {
      id: 'pnl',
      header: 'Unrealized P&L',
      accessor: (row) => row.unrealizedPnL,
      align: 'right',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "font-mono tabular-nums font-semibold",
            value >= 0 ? 'text-success' : 'text-danger'
          )}>
            {value >= 0 ? '+' : ''}${value.toFixed(2)}
          </span>
          <Badge 
            variant={row.unrealizedPnLPercentage >= 0 ? 'default' : 'destructive'}
            className="text-xs"
          >
            {row.unrealizedPnLPercentage >= 0 ? '+' : ''}{row.unrealizedPnLPercentage.toFixed(2)}%
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Trading Dashboard
          </h1>
          <p className="text-text-muted mt-1">
            Welcome back! Here's your trading performance overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/trades')}
          >
            View All Trades
          </Button>
          <Button 
            className="gap-2 bg-gradient-accent hover:opacity-90"
            onClick={() => router.push('/dashboard/trades/add')}
          >
            <Plus className="h-4 w-4" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total P&L"
          value={`${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}`}
          change={24.3}
          changeLabel="vs last month"
          trend={totalPnL >= 0 ? 'up' : 'down'}
          color={totalPnL >= 0 ? 'success' : 'danger'}
          icon={<DollarSign className="h-4 w-4" />}
          sparkline={chartData.map(d => ({ value: d.pnl }))}
        />
        
        <MetricCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`${metrics?.winningTrades || 0}/${totalTrades} trades`}
          progress={winRate / 100}
          color="info"
          icon={<Target className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Today's P&L"
          value={`${todayPnL >= 0 ? '+' : ''}$${Math.abs(todayPnL).toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}`}
          trend={todayPnL >= 0 ? 'up' : 'down'}
          comparison="↑ 12% from yesterday"
          color={todayPnL >= 0 ? 'success' : 'danger'}
          icon={<Clock className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Active Positions"
          value={positions.length}
          subtitle="Across 2 wallets"
          color="warning"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Chart */}
        <Card className="lg:col-span-2 bg-surface border-border-default">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">P&L Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChartComponent
              data={chartData}
              dataKey="pnl"
              xAxisKey="date"
              height={250}
              color="rgb(var(--color-success))"
              gradient={true}
            />
          </CardContent>
        </Card>

        {/* Token Distribution */}
        <Card className="bg-surface border-border-default">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Token Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={tokenDistribution}
              dataKey="value"
              nameKey="name"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Open Positions */}
      <Card className="bg-surface border-border-default">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Open Positions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/positions')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={positionColumns}
            data={positions}
            loading={isLoading}
            onRowClick={(row) => console.log('Position clicked:', row)}
          />
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="bg-surface border-border-default">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Trades</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/trades')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trades.slice(0, 4).map((trade) => {
              const pnl = trade.priceOut && trade.priceIn 
                ? ((trade.amountOut * trade.priceOut) - (trade.amountIn * trade.priceIn))
                : 0;
              const pnlPercentage = trade.priceIn && trade.priceOut
                ? ((trade.priceOut - trade.priceIn) / trade.priceIn) * 100
                : 0;

              return (
                <TradeCard
                  key={trade.id}
                  type={trade.type}
                  tokenPair={{
                    from: trade.tokenIn,
                    to: trade.tokenOut
                  }}
                  metrics={[
                    { label: 'Entry', value: trade.priceIn?.toFixed(4) || '—', prefix: '$' },
                    { label: 'Exit', value: trade.priceOut?.toFixed(4) || '—', prefix: '$' },
                    { label: 'Size', value: trade.amountIn.toFixed(2) }
                  ]}
                  pnl={{
                    amount: pnl.toFixed(2),
                    percentage: pnlPercentage
                  }}
                  status={pnl >= 0 ? 'profit' : 'loss'}
                  timestamp={new Date(trade.executedAt).toLocaleDateString()}
                  dex={trade.dex}
                  fees={`$${trade.fees.toFixed(2)}`}
                  notes={trade.notes}
                  mistakes={trade.mistakes?.length}
                  onClick={() => router.push(`/dashboard/trades/edit/${trade.id}`)}
                  onEdit={() => router.push(`/dashboard/trades/edit/${trade.id}`)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Volume by DEX */}
      <Card className="bg-surface border-border-default">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Volume by DEX</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent
            data={volumeData}
            dataKeys={[
              { key: 'volume', color: 'rgb(var(--color-accent))', name: 'Volume' },
            ]}
            xAxisKey="dex"
            height={250}
            showLegend={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}