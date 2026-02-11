export interface TradeMetrics {
  totalPnL: number;
  totalVolume: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  biggestWin: number;
  biggestLoss: number;
  profitFactor: number;
  avgHoldTime: number;
}

export interface PnLBreakdown {
  daily: DailyPnL[];
  weekly: WeeklyPnL[];
  monthly: MonthlyPnL[];
}

export interface DailyPnL {
  date: string;
  pnl: number;
  volume: number;
  trades: number;
  cumulativePnL: number;
}

export interface WeeklyPnL {
  week: string;
  startDate: string;
  endDate: string;
  pnl: number;
  volume: number;
  trades: number;
}

export interface MonthlyPnL {
  month: string;
  year: number;
  pnl: number;
  volume: number;
  trades: number;
}

export interface TradeFilter {
  tokenAddress?: string;
  startDate?: Date;
  endDate?: Date;
  tradeType?: 'buy' | 'sell' | 'swap';
  pnlType?: 'profit' | 'loss' | 'all';
  dex?: string;
  minVolume?: number;
  maxVolume?: number;
}

export interface TokenPerformance {
  tokenAddress: string;
  tokenSymbol: string;
  totalPnL: number;
  totalVolume: number;
  tradeCount: number;
  winRate: number;
  avgPnL: number;
}