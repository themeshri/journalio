'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ChevronRight,
  Copy,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Badge } from './badge';

interface TokenPair {
  from: string;
  to: string;
  fromIcon?: string;
  toIcon?: string;
}

interface TradeMetric {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
}

interface TradeCardProps {
  id?: string;
  status?: 'profit' | 'loss' | 'neutral';
  type: 'BUY' | 'SELL' | 'SWAP';
  tokenPair: TokenPair;
  metrics: TradeMetric[];
  timestamp?: string;
  dex?: string;
  pnl?: {
    amount: string | number;
    percentage: number;
  };
  fees?: string | number;
  notes?: string;
  mistakes?: number;
  isManual?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onJournal?: () => void;
  onCopy?: () => void;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export function TradeCard({
  id,
  status = 'neutral',
  type,
  tokenPair,
  metrics,
  timestamp,
  dex,
  pnl,
  fees,
  notes,
  mistakes,
  isManual = false,
  onEdit,
  onDelete,
  onJournal,
  onCopy,
  onClick,
  className,
  loading = false,
}: TradeCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'profit':
        return 'border-success/20 bg-gradient-to-r from-success/5 to-success/10';
      case 'loss':
        return 'border-danger/20 bg-gradient-to-r from-danger/5 to-danger/10';
      default:
        return 'border-border-default bg-surface';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'BUY':
        return 'bg-success/10 text-success border-success/20';
      case 'SELL':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'SWAP':
        return 'bg-info/10 text-info border-info/20';
    }
  };

  const getPnLColor = () => {
    if (!pnl) return 'text-text-secondary';
    return pnl.percentage >= 0 ? 'text-success' : 'text-danger';
  };

  if (loading) {
    return (
      <div className={cn(
        'relative rounded-lg border p-4',
        'bg-surface border-border-default',
        className
      )}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-surface-hover rounded animate-pulse" />
            <div className="h-5 w-16 bg-surface-hover rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-12 bg-surface-hover rounded animate-pulse" />
                <div className="h-5 w-20 bg-surface-hover rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-200',
        'hover:shadow-md cursor-pointer group',
        getStatusColor(),
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Token Pair */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {tokenPair.fromIcon ? (
                <img 
                  src={tokenPair.fromIcon} 
                  alt={tokenPair.from}
                  className="w-6 h-6 rounded-full border-2 border-surface bg-surface"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-white border-2 border-surface">
                  {tokenPair.from.charAt(0)}
                </div>
              )}
              {tokenPair.toIcon ? (
                <img 
                  src={tokenPair.toIcon} 
                  alt={tokenPair.to}
                  className="w-6 h-6 rounded-full border-2 border-surface bg-surface"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-white border-2 border-surface">
                  {tokenPair.to.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 font-medium">
              <span className="text-text-primary">{tokenPair.from}</span>
              <ChevronRight className="h-4 w-4 text-text-muted" />
              <span className="text-text-primary">{tokenPair.to}</span>
            </div>
          </div>

          {/* Type Badge */}
          <Badge 
            className={cn(
              'font-semibold border',
              getTypeColor()
            )}
          >
            {type}
          </Badge>

          {/* Additional Badges */}
          {isManual && (
            <Badge variant="secondary" className="text-xs">
              Manual
            </Badge>
          )}
          {dex && (
            <Badge variant="outline" className="text-xs">
              {dex}
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            <span>{timestamp}</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="text-xs text-text-muted">{metric.label}</div>
            <div className="text-sm font-medium text-text-primary font-mono tabular-nums">
              {metric.prefix}{metric.value}{metric.suffix}
              {metric.change !== undefined && (
                <span className={cn(
                  'ml-1 text-xs',
                  metric.change >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* P&L Section */}
      {pnl && (
        <div className="flex items-center justify-between py-3 border-t border-border-default/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">P&L</span>
            <div className={cn(
              'flex items-center gap-2 font-semibold',
              getPnLColor()
            )}>
              {pnl.percentage >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="font-mono tabular-nums">
                {typeof pnl.amount === 'number' && pnl.amount >= 0 ? '+' : ''}{pnl.amount}
              </span>
              <Badge 
                variant={pnl.percentage >= 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {pnl.percentage > 0 ? '+' : ''}{pnl.percentage.toFixed(2)}%
              </Badge>
            </div>
          </div>
          
          {fees && (
            <div className="text-xs text-text-muted">
              Fees: <span className="font-mono">{fees}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer with Actions and Info */}
      <div className="flex items-center justify-between mt-3">
        {/* Info badges */}
        <div className="flex items-center gap-2">
          {notes && (
            <Badge variant="outline" className="text-xs gap-1">
              <BookOpen className="h-3 w-3" />
              Notes
            </Badge>
          )}
          {mistakes && mistakes > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertCircle className="h-3 w-3" />
              {mistakes} {mistakes === 1 ? 'Mistake' : 'Mistakes'}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onJournal && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onJournal();
              }}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-danger hover:bg-danger/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}