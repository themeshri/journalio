'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, DollarSign, Clock, Package, Activity } from 'lucide-react';
import { PositionMetrics } from '@/types/position';

interface PositionOverviewProps {
  metrics: PositionMetrics;
  isLoading?: boolean;
}

export function PositionOverview({ metrics, isLoading }: PositionOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
          {metrics.totalNetPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            metrics.totalNetPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(metrics.totalNetPnL)}
          </div>
          <p className="text-xs text-muted-foreground">
            Realized: {formatCurrency(metrics.totalRealizedPnL)}
          </p>
          <p className="text-xs text-muted-foreground">
            Unrealized: {formatCurrency(metrics.totalUnrealizedPnL)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Position Win Rate</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(metrics.positionWinRate)}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.closedPositions} closed positions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalPositions}</div>
          <div className="flex space-x-2 text-xs text-muted-foreground">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {metrics.openPositions} open
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
              {metrics.closedPositions} closed
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(metrics.avgPositionDuration)}</div>
          <p className="text-xs text-muted-foreground">
            Average hold time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Largest Win</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(metrics.largestWin)}
          </div>
          <p className="text-xs text-muted-foreground">
            Best position
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Largest Loss</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics.largestLoss)}
          </div>
          <p className="text-xs text-muted-foreground">
            Worst position
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Position Summary</CardTitle>
          <CardDescription>
            Key insights from your position tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Average Position Size</div>
              <div className="text-xl font-bold">{formatCurrency(metrics.avgPositionSize)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Fees Paid</div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(metrics.totalFees)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Open Position Value</div>
              <div className={`text-xl font-bold ${
                metrics.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.totalUnrealizedPnL)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}