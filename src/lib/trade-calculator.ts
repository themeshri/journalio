import { ParsedTrade } from '@/types/trade';

export class TradeCalculator {
  /**
   * Calculate P&L for a trade given token prices
   */
  static calculatePnL(trade: ParsedTrade, priceIn?: number, priceOut?: number): {
    pnl: number;
    pnlPercentage: number;
    feesUSD: number;
    totalValue: number;
  } {
    const amountIn = parseFloat(trade.amountIn);
    const amountOut = parseFloat(trade.amountOut);
    const fees = parseFloat(trade.fees);

    // If we don't have prices, we can't calculate P&L
    if (!priceIn || !priceOut) {
      return {
        pnl: 0,
        pnlPercentage: 0,
        feesUSD: 0,
        totalValue: 0
      };
    }

    const valueIn = amountIn * priceIn;
    const valueOut = amountOut * priceOut;
    const feesUSD = fees * 100; // Assuming SOL price around $100 for fees

    const pnl = valueOut - valueIn - feesUSD;
    const pnlPercentage = valueIn > 0 ? (pnl / valueIn) * 100 : 0;

    return {
      pnl,
      pnlPercentage,
      feesUSD,
      totalValue: valueOut
    };
  }

  /**
   * Calculate aggregate statistics for multiple trades
   */
  static calculatePortfolioStats(trades: ParsedTrade[]): {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalFees: number;
    totalVolume: number;
  } {
    const stats = {
      totalTrades: trades.length,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalFees: 0,
      totalVolume: 0
    };

    for (const trade of trades) {
      const priceIn = trade.priceIn ? parseFloat(trade.priceIn) : 0;
      const priceOut = trade.priceOut ? parseFloat(trade.priceOut) : 0;
      
      if (priceIn && priceOut) {
        const pnl = this.calculatePnL(trade, priceIn, priceOut);
        
        if (pnl.pnl > 0) {
          stats.winningTrades++;
        } else if (pnl.pnl < 0) {
          stats.losingTrades++;
        }

        stats.totalPnL += pnl.pnl;
        stats.totalFees += pnl.feesUSD;
        stats.totalVolume += pnl.totalValue;
      }
    }

    stats.winRate = stats.totalTrades > 0 ? 
      (stats.winningTrades / stats.totalTrades) * 100 : 0;

    return stats;
  }

  /**
   * Format currency values for display
   */
  static formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
  }
}