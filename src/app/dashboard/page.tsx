'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const response = await fetch('/api/trades/simple');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate basic metrics
  const totalTrades = trades.length;
  const totalMistakes = trades.reduce((acc, trade) => acc + (trade.mistakes?.length || 0), 0);
  const totalVolume = trades.reduce((acc, trade) => {
    const inValue = trade.amountIn * (trade.priceIn || 1);
    const outValue = trade.amountOut * (trade.priceOut || 1);
    return acc + Math.max(inValue, outValue);
  }, 0);

  const recentTrades = trades.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <div className="text-2xl font-bold">${totalVolume.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all DEXs
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
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              Estimated from trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>
            Your latest Solana trading activity
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link href="/dashboard/trades">
              <Button variant="outline" className="w-full">
                View All Trades
              </Button>
            </Link>
          </div>
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