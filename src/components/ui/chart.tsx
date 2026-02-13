'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BaseChartProps {
  data: any[];
  height?: number;
  className?: string;
  loading?: boolean;
}

interface AreaChartProps extends BaseChartProps {
  dataKey: string;
  xAxisKey: string;
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  fillOpacity?: number;
}

interface BarChartProps extends BaseChartProps {
  dataKeys: { key: string; color: string; name?: string }[];
  xAxisKey: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

interface LineChartProps extends BaseChartProps {
  lines: { key: string; color: string; name?: string; strokeWidth?: number }[];
  xAxisKey: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
}

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  innerRadius?: number;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-border-default bg-surface p-3 shadow-lg">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-secondary">
            {entry.name || entry.dataKey}:
          </span>
          <span className="text-sm font-semibold text-text-primary font-mono">
            {typeof entry.value === 'number' 
              ? entry.value.toLocaleString() 
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Loading Component
const ChartLoading = ({ height = 300 }: { height: number }) => (
  <div 
    className="flex items-center justify-center bg-surface rounded-lg border border-border-default"
    style={{ height }}
  >
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      <p className="mt-2 text-sm text-text-muted">Loading chart...</p>
    </div>
  </div>
);

// Area Chart Component
export function AreaChartComponent({
  data,
  dataKey,
  xAxisKey,
  color = 'rgb(var(--color-primary))',
  gradient = true,
  height = 300,
  showGrid = true,
  showTooltip = true,
  fillOpacity = 0.3,
  className,
  loading = false,
}: AreaChartProps) {
  if (loading) return <ChartLoading height={height} />;

  const gradientId = `gradient-${dataKey}`;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {gradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgb(var(--color-border-default))" 
              opacity={0.3}
            />
          )}
          <XAxis 
            dataKey={xAxisKey}
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={gradient ? `url(#${gradientId})` : color}
            fillOpacity={gradient ? 1 : fillOpacity}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart Component
export function BarChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  stacked = false,
  className,
  loading = false,
}: BarChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgb(var(--color-border-default))" 
              opacity={0.3}
            />
          )}
          <XAxis 
            dataKey={xAxisKey}
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {dataKeys.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.name || item.key}
              fill={item.color}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Line Chart Component
export function LineChartComponent({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  showDots = false,
  className,
  loading = false,
}: LineChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgb(var(--color-border-default))" 
              opacity={0.3}
            />
          )}
          <XAxis 
            dataKey={xAxisKey}
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgb(var(--color-text-muted))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}
          <ReferenceLine 
            y={0} 
            stroke="rgb(var(--color-text-muted))" 
            strokeDasharray="3 3"
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name || line.key}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={showDots}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie Chart Component
export function PieChartComponent({
  data,
  dataKey,
  nameKey,
  colors = [
    'rgb(var(--color-success))',
    'rgb(var(--color-danger))',
    'rgb(var(--color-warning))',
    'rgb(var(--color-info))',
    'rgb(var(--color-accent))',
  ],
  height = 300,
  showTooltip = true,
  showLegend = true,
  innerRadius = 0,
  className,
  loading = false,
}: PieChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend 
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
            />
          )}
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="40%"
            cy="50%"
            outerRadius={height / 3}
            innerRadius={innerRadius}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}