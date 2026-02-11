'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setTrades(tradesData.trades || []);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use real metrics or fallback to basic calculations
  const totalTrades = metrics?.totalTrades || trades.length;
  const totalMistakes = metrics?.mistakeCount || trades.reduce((acc, trade) => acc + (trade.mistakes?.length || 0), 0);
  const totalVolume = metrics?.totalVolume || trades.reduce((acc, trade) => {
    const inValue = trade.amountIn * (trade.priceIn || 1);
    const outValue = trade.amountOut * (trade.priceOut || 1);
    return acc + Math.max(inValue, outValue);
  }, 0);
  const winRate = metrics?.winRate || 0;

  const recentTrades = trades.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-muted/60 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-muted/60 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Trades Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-muted/60 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-12 bg-muted rounded animate-pulse"></div>
                    <div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-32 bg-muted/60 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-12 bg-muted/60 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Solana trading activity
          </p>
        </div>
        <Link href="/dashboard/trades/add">
          <Button>
            <Activity className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              Solana ecosystem trades
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalVolume > 1000000 
                ? `${(totalVolume / 1000000).toFixed(1)}M` 
                : totalVolume > 1000 
                ? `${(totalVolume / 1000).toFixed(1)}K` 
                : totalVolume.toFixed(0)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? 'Real volume traded' : totalVolume === 0 ? 'No volume yet' : 'Estimated volume'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Mistakes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMistakes}</div>
            <p className="text-xs text-muted-foreground">
              Learning opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics ? 'Calculated from P&L' : 'No data available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Overview - Only show if we have real metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {metrics.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${metrics.totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Net profit/loss
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Gross profit / Gross loss
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${metrics.biggestWin.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Biggest winner
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>
            Your latest Solana trading activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No trades yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Get started by importing trades from your wallet or adding them manually
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/dashboard/trades/add">
                  <Button>
                    <Activity className="h-4 w-4 mr-2" />
                    Add Manual Trade
                  </Button>
                </Link>
                <Link href="/dashboard/wallet">
                  <Button variant="outline">
                    Import from Wallet
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                    {trade.type}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {trade.amountIn} {trade.tokenIn} → {trade.amountOut} {trade.tokenOut}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trade.dex} • {new Date(trade.executedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {trade.mistakes && trade.mistakes.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {trade.mistakes.length} mistake{trade.mistakes.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard/trades">
                  <Button variant="outline" className="w-full">
                    View All Trades
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journal Your Trades</CardTitle>
            <CardDescription>
              Add detailed notes and analysis to your trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/trades">
              <Button className="w-full">
                Go to Trades
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">View Analytics</CardTitle>
            <CardDescription>
              Analyze your trading performance and patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manage Positions</CardTitle>
            <CardDescription>
              Track your current positions and holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/positions">
              <Button className="w-full" variant="outline">
                View Positions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}