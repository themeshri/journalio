'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { DailyPnL } from '@/types/analytics';

interface PnLChartProps {
  data: DailyPnL[];
  isLoading?: boolean;
}

export function PnLChart({ data, isLoading }: PnLChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P&L Chart</CardTitle>
          <CardDescription>Daily profit and loss over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Chart</CardTitle>
        <CardDescription>Cumulative profit and loss over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(label) => formatDate(label)}
              formatter={(value, name) => [
                formatCurrency(Number(value)), 
                name === 'cumulativePnL' ? 'Cumulative P&L' : 'Daily P&L'
              ]}
            />
            <Area
              type="monotone"
              dataKey="cumulativePnL"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPnL)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}