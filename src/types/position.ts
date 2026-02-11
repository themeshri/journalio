export interface Position {
  id: string;
  symbol: string; // Token symbol (derived from tokenIn/tokenOut)
  walletAddress: string;
  openDate: Date;
  closeDate?: Date;
  status: 'open' | 'closed';
  
  // Calculated fields
  totalQuantity: number; // Net position size (positive = long, negative = short)
  avgEntryPrice: number; // Volume-weighted average entry price
  avgExitPrice?: number; // Volume-weighted average exit price (for closed positions)
  realizedPnL: number; // Realized profit/loss from closed portions
  unrealizedPnL: number; // Unrealized profit/loss from open portions
  fees: number; // Total fees paid for this position
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PositionTrade {
  id: string;
  positionId: string;
  tradeId: string;
  role: 'entry' | 'exit'; // Whether this trade opens or closes position
  quantity: number; // Amount of tokens in this trade
  price: number; // Price per token for this trade
  fees: number; // Fees for this specific trade
  timestamp: Date;
}

export interface PositionMetrics {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalNetPnL: number;
  positionWinRate: number; // Percentage of closed positions that were profitable
  avgPositionDuration: number; // Average duration in hours for closed positions
  avgPositionSize: number; // Average USD value of positions
  largestWin: number; // Biggest winning closed position
  largestLoss: number; // Biggest losing closed position
  totalFees: number;
}

export interface PositionGrouping {
  id: string;
  positionId: string;
  tradeIds: string[];
  groupingType: 'manual' | 'auto_fifo';
  reason?: string; // Reason for manual grouping
  createdBy?: string; // User ID who created manual grouping
  createdAt: Date;
}

export interface TradeGroupingRule {
  id: string;
  walletAddress: string;
  tokenSymbol: string;
  algorithm: 'fifo' | 'lifo' | 'manual';
  maxTimeGap: number; // Maximum time between trades to group (in hours)
  minQuantityThreshold: number; // Minimum quantity to consider as position
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// For API responses and frontend consumption
export interface PositionWithTrades extends Position {
  trades: PositionTrade[];
  token: {
    address: string;
    symbol: string;
    decimals: number;
    logoUrl?: string;
  };
}

export interface PositionSummary {
  symbol: string;
  tokenAddress: string;
  totalPositions: number;
  openPositions: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  winRate: number;
  avgDuration: number;
  totalVolume: number;
}

// Filter types for position queries
export interface PositionFilter {
  walletAddress?: string;
  tokenAddress?: string;
  status?: 'open' | 'closed';
  startDate?: Date;
  endDate?: Date;
  minPnL?: number;
  maxPnL?: number;
  limit?: number;
  offset?: number;
}

// Position calculation inputs
export interface TradeForPosition {
  id: string;
  signature: string;
  type: 'buy' | 'sell' | 'swap';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceIn?: number;
  priceOut?: number;
  fees: number;
  blockTime: Date;
  walletAddress: string;
}

// FIFO queue item for position tracking
export interface FIFOQueueItem {
  quantity: number;
  price: number;
  fees: number;
  tradeId: string;
  timestamp: Date;
}

// Position calculation result
export interface PositionCalculationResult {
  positions: Position[];
  positionTrades: PositionTrade[];
  errors: string[];
  warnings: string[];
}