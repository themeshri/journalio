import { ParsedTrade } from '@/types/trade';

export class TradeCalculator {
  /**
   * Calculate realized P&L for a trade
   * @param trade - Parsed trade data
   * @param tokenInPrice - Price of token sold (in USD)
   * @param tokenOutPrice - Price of token bought (in USD)
   * @returns Realized P&L in USD
   */
  static calculateRealizedPnL(
    trade: ParsedTrade,
    tokenInPrice?: number,
    tokenOutPrice?: number
  ): {
    pnlUsd?: number;
    valueIn?: number;
    valueOut?: number;
    fees?: number;
  } {
    const fees = parseFloat(trade.fees) * (tokenInPrice || 0); // Assuming fees in SOL, convert to USD

    if (!tokenInPrice || !tokenOutPrice) {
      return { fees };
    }

    const amountIn = parseFloat(trade.amountIn);
    const amountOut = parseFloat(trade.amountOut);

    const valueIn = amountIn * tokenInPrice;
    const valueOut = amountOut * tokenOutPrice;

    // P&L = value received - value given - fees
    const pnlUsd = valueOut - valueIn - fees;

    return {
      pnlUsd,
      valueIn,
      valueOut,
      fees
    };
  }

  /**
   * Calculate unrealized P&L for current holdings
   * @param purchases - Array of purchase trades
   * @param sales - Array of sale trades
   * @param currentPrice - Current token price
   * @returns Unrealized P&L data
   */
  static calculateUnrealizedPnL(
    purchases: ParsedTrade[],
    sales: ParsedTrade[],
    currentPrice: number
  ): {
    remainingTokens: number;
    averageCost: number;
    unrealizedPnL: number;
    currentValue: number;
  } {
    let totalTokensBought = 0;
    let totalCostBasis = 0;

    // Calculate total purchases
    for (const purchase of purchases) {
      const tokens = parseFloat(purchase.amountOut);
      const cost = parseFloat(purchase.priceIn || '0') * parseFloat(purchase.amountIn);
      
      totalTokensBought += tokens;
      totalCostBasis += cost;
    }

    // Calculate total sales
    let totalTokensSold = 0;
    for (const sale of sales) {
      totalTokensSold += parseFloat(sale.amountIn);
    }

    const remainingTokens = totalTokensBought - totalTokensSold;
    const averageCost = remainingTokens > 0 ? totalCostBasis / totalTokensBought : 0;
    const currentValue = remainingTokens * currentPrice;
    const costBasisRemaining = remainingTokens * averageCost;
    const unrealizedPnL = currentValue - costBasisRemaining;

    return {
      remainingTokens,
      averageCost,
      unrealizedPnL,
      currentValue
    };
  }

  /**
   * Calculate portfolio metrics
   * @param trades - All trades for a wallet
   * @param currentPrices - Current token prices
   * @returns Portfolio performance metrics
   */
  static calculatePortfolioMetrics(
    trades: ParsedTrade[],
    currentPrices: Record<string, number>
  ): {
    totalRealizedPnL: number;
    totalUnrealizedPnL: number;
    totalPortfolioValue: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
  } {
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;
    let winningTrades = 0;

    const tokenHoldings: Record<string, ParsedTrade[]> = {};

    // Group trades by token
    for (const trade of trades) {
      if (!trade.success) continue;

      const token = trade.type === 'buy' ? trade.tokenOut : trade.tokenIn;
      if (!tokenHoldings[token]) {
        tokenHoldings[token] = [];
      }
      tokenHoldings[token].push(trade);
    }

    // Calculate P&L for each token
    for (const [token, tokenTrades] of Object.entries(tokenHoldings)) {
      const purchases = tokenTrades.filter(t => t.type === 'buy');
      const sales = tokenTrades.filter(t => t.type === 'sell');

      // Calculate realized P&L from sales
      for (const sale of sales) {
        const tokenInPrice = parseFloat(sale.priceIn || '0');
        const tokenOutPrice = parseFloat(sale.priceOut || '0');
        
        if (tokenInPrice && tokenOutPrice) {
          const { pnlUsd } = this.calculateRealizedPnL(sale, tokenInPrice, tokenOutPrice);
          if (pnlUsd) {
            totalRealizedPnL += pnlUsd;
            if (pnlUsd > 0) winningTrades++;
          }
        }
      }

      // Calculate unrealized P&L for remaining holdings
      const currentPrice = currentPrices[token];
      if (currentPrice && purchases.length > 0) {
        const { unrealizedPnL } = this.calculateUnrealizedPnL(purchases, sales, currentPrice);
        totalUnrealizedPnL += unrealizedPnL;
      }
    }

    const totalTrades = trades.filter(t => t.success && (t.type === 'buy' || t.type === 'sell')).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalRealizedPnL,
      totalUnrealizedPnL,
      totalPortfolioValue: totalRealizedPnL + totalUnrealizedPnL,
      winRate,
      totalTrades,
      winningTrades
    };
  }
}