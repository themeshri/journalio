'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, Target, DollarSign, Activity } from 'lucide-react';

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
  mistakes?: Array<{
    id: string;
    mistakeType: string;
    severity: string;
  }>;
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const response = await fetch('/api/trades');
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate analytics
  const totalTrades = trades.length;
  const buyTrades = trades.filter(t => t.type === 'BUY').length;
  const sellTrades = trades.filter(t => t.type === 'SELL').length;
  const totalMistakes = trades.reduce((acc, trade) => acc + (trade.mistakes?.length || 0), 0);
  const highSeverityMistakes = trades.reduce((acc, trade) => 
    acc + (trade.mistakes?.filter(m => m.severity === 'HIGH').length || 0), 0
  );

  // Token analysis
  const tokenCounts = trades.reduce((acc, trade) => {
    acc[trade.tokenOut] = (acc[trade.tokenOut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostTradedTokens = Object.entries(tokenCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // DEX analysis
  const dexCounts = trades.reduce((acc, trade) => {
    acc[trade.dex] = (acc[trade.dex] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedDex = Object.entries(dexCounts)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trading Analytics</h1>
        <p className="text-muted-foreground">
          Analysis of your Solana trading performance and patterns
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {buyTrades} buys, {sellTrades} sells
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
              Estimated from patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mistakes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMistakes}</div>
            <p className="text-xs text-muted-foreground">
              {highSeverityMistakes} high severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trade Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$850</div>
            <p className="text-xs text-muted-foreground">
              Across all tokens
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Traded Tokens */}
        <Card>
          <CardHeader>
            <CardTitle>Most Traded Tokens</CardTitle>
            <CardDescription>
              Your most active trading pairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostTradedTokens.map(([token, count]) => (
                <div key={token} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{token}</Badge>
                  </div>
                  <div className="text-sm font-medium">{count} trades</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* DEX Usage */}
        <Card>
          <CardHeader>
            <CardTitle>DEX Usage</CardTitle>
            <CardDescription>
              Your preferred decentralized exchanges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostUsedDex.map(([dex, count]) => (
                <div key={dex} className="flex items-center justify-between">
                  <div className="font-medium">{dex}</div>
                  <div className="text-sm text-muted-foreground">
                    {count} trades ({Math.round((count / totalTrades) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mistake Analysis */}
      {totalMistakes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mistake Analysis</CardTitle>
            <CardDescription>
              Learn from your trading mistakes to improve performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{highSeverityMistakes}</div>
                <div className="text-sm text-muted-foreground">High Severity</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {trades.reduce((acc, t) => acc + (t.mistakes?.filter(m => m.severity === 'MEDIUM').length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Medium Severity</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {trades.reduce((acc, t) => acc + (t.mistakes?.filter(m => m.severity === 'LOW').length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Low Severity</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              {trades.filter(t => t.mistakes && t.mistakes.length > 0).slice(0, 3).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{trade.tokenIn} → {trade.tokenOut}</div>
                    <div className="text-sm text-muted-foreground">
                      {trade.mistakes?.map(m => m.mistakeType).join(', ')}
                    </div>
                  </div>
                  <Badge variant="destructive">{trade.mistakes?.[0]?.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Insights</CardTitle>
          <CardDescription>
            Key patterns and recommendations based on your trading data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">Most Active Token: {mostTradedTokens[0]?.[0] || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">
                  You've traded {mostTradedTokens[0]?.[1] || 0} times with this token
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Preferred DEX: {mostUsedDex[0]?.[0] || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round((mostUsedDex[0]?.[1] || 0) / totalTrades * 100)}% of your trades use this exchange
                </div>
              </div>
            </div>

            {totalMistakes > 0 && (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-medium">Learning Opportunity</div>
                  <div className="text-sm text-muted-foreground">
                    Focus on reducing {highSeverityMistakes > 0 ? 'high severity mistakes' : 'trading mistakes'} to improve performance
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}