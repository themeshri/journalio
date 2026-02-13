'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineData {
  value: number;
  timestamp?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  sparkline?: SparklineData[];
  comparison?: string;
  progress?: number; // 0 to 1
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  trend,
  subtitle,
  icon,
  color = 'default',
  sparkline,
  comparison,
  progress,
  loading = false,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'neutral':
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-text-secondary';
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-danger';
      case 'neutral':
        return 'text-text-secondary';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'danger':
        return 'border-danger/20 bg-danger/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'info':
        return 'border-info/20 bg-info/5';
      default:
        return 'border-border-default bg-surface';
    }
  };

  const getValueColor = () => {
    switch (color) {
      case 'success':
        return 'text-success';
      case 'danger':
        return 'text-danger';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-info';
      default:
        return 'text-text-primary';
    }
  };

  // Generate sparkline SVG path
  const generateSparklinePath = () => {
    if (!sparkline || sparkline.length < 2) return '';
    
    const width = 100;
    const height = 30;
    const values = sparkline.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const points = sparkline.map((d, i) => {
      const x = (i / (sparkline.length - 1)) * width;
      const y = height - ((d.value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  if (loading) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-lg border p-6',
        getColorClasses(),
        className
      )}>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-surface-hover rounded animate-pulse" />
          <div className="h-8 w-32 bg-surface-hover rounded animate-pulse" />
          <div className="h-3 w-16 bg-surface-hover rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg border p-6 transition-all duration-200 hover:shadow-lg hover-lift',
      getColorClasses(),
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-2 rounded-lg bg-surface-hover">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-text-secondary">
              {title}
            </h3>
          </div>
          {sparkline && sparkline.length > 1 && (
            <svg
              className="h-8 w-24"
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
            >
              <path
                d={generateSparklinePath()}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn(
                  'opacity-50',
                  trend === 'up' && 'text-success',
                  trend === 'down' && 'text-danger',
                  !trend && 'text-text-muted'
                )}
              />
            </svg>
          )}
        </div>

        {/* Value */}
        <div className="space-y-2">
          <div className={cn(
            'text-2xl font-bold font-mono tabular-nums',
            getValueColor()
          )}>
            {value}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-500',
                  color === 'success' && 'bg-gradient-profit',
                  color === 'danger' && 'bg-gradient-loss',
                  color === 'warning' && 'bg-warning',
                  color === 'info' && 'bg-info',
                  color === 'default' && 'bg-gradient-accent'
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              />
            </div>
          )}

          {/* Change indicator */}
          {(change !== undefined || changeLabel) && (
            <div className={cn(
              'flex items-center gap-2 text-sm',
              getTrendColor()
            )}>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {change !== undefined && (
                  <span className="font-medium">
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                )}
              </div>
              {changeLabel && (
                <span className="text-text-muted">
                  {changeLabel}
                </span>
              )}
            </div>
          )}

          {/* Subtitle or comparison */}
          {(subtitle || comparison) && (
            <div className="text-xs text-text-muted">
              {subtitle && <span>{subtitle}</span>}
              {comparison && (
                <div className="flex items-center gap-1 mt-1">
                  {comparison.includes('↑') ? (
                    <ArrowUp className="h-3 w-3 text-success" />
                  ) : comparison.includes('↓') ? (
                    <ArrowDown className="h-3 w-3 text-danger" />
                  ) : null}
                  <span>{comparison.replace(/[↑↓]/g, '').trim()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}