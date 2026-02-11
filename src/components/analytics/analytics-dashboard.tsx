'use client';

import { useState, useEffect } from 'react';
import { MetricsOverview } from './metrics-overview';
import { PnLChart } from './pnl-chart';
import { TradeFilters } from './trade-filters';
import { TradesTable } from './trades-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeMetrics, TradeFilter, DailyPnL } from '@/types/analytics';

interface AnalyticsDashboardProps {
  initialMetrics: TradeMetrics;
  initialPnlData: DailyPnL[];
  initialTrades: any[];
  walletCount: number;
}

export function AnalyticsDashboard({ 
  initialMetrics, 
  initialPnlData, 
  initialTrades,
  walletCount 
}: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [pnlData, setPnlData] = useState(initialPnlData);
  const [trades, setTrades] = useState(initialTrades);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TradeFilter>({});

  // Mock data for filters (in real implementation, fetch from API)
  const availableTokens = [
    { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' },
  ];
  
  const availableDexes = ['raydium', 'orca', 'jupiter'];

  const handleFiltersChange = async (newFilters: TradeFilter) => {
    setFilters(newFilters);
    setIsLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (newFilters.startDate) {
        params.append('startDate', newFilters.startDate.toISOString());
      }
      if (newFilters.endDate) {
        params.append('endDate', newFilters.endDate.toISOString());
      }
      if (newFilters.tokenAddress) {
        params.append('tokenAddress', newFilters.tokenAddress);
      }
      if (newFilters.tradeType) {
        params.append('tradeType', newFilters.tradeType);
      }
      if (newFilters.pnlType) {
        params.append('pnlType', newFilters.pnlType);
      }
      if (newFilters.dex) {
        params.append('dex', newFilters.dex);
      }

      // Fetch updated metrics
      const metricsResponse = await fetch(`/api/analytics/metrics?${params.toString()}`);
      const newMetrics = await metricsResponse.json();
      setMetrics(newMetrics);

      // Fetch updated trades
      const tradesResponse = await fetch(`/api/analytics/trades?${params.toString()}`);
      const tradesData = await tradesResponse.json();
      setTrades(tradesData.trades || []);

    } catch (error) {
      console.error('Failed to update analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-sm text-muted-foreground">
          Data from {walletCount} wallet{walletCount !== 1 ? 's' : ''}
        </div>
      </div>

      <MetricsOverview metrics={metrics} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <PnLChart data={pnlData} isLoading={isLoading} />
        
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

      <TradeFilters 
        onFiltersChange={handleFiltersChange}
        availableTokens={availableTokens}
        availableDexes={availableDexes}
      />

      <TradesTable trades={trades} isLoading={isLoading} />
    </div>
  );
}