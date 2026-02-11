import { prisma } from './db';
import { TradeMetrics, PnLBreakdown, TokenPerformance, TradeFilter } from '@/types/analytics';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export class AnalyticsService {
  async calculateWalletMetrics(walletId: string, filters?: TradeFilter): Promise<TradeMetrics> {
    const trades = await this.getFilteredTrades(walletId, filters);
    
    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const pnlTrades = trades.filter(trade => 
      trade.priceIn && trade.priceOut && 
      parseFloat(trade.amountIn) > 0 && parseFloat(trade.amountOut) > 0
    );

    const winningTrades = pnlTrades.filter(trade => this.calculateTradePnL(trade) > 0);
    const losingTrades = pnlTrades.filter(trade => this.calculateTradePnL(trade) < 0);
    
    const totalPnL = pnlTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
    const totalVolume = pnlTrades.reduce((sum, trade) => 
      sum + (parseFloat(trade.amountIn) * parseFloat(trade.priceIn || '0')), 0
    );

    const winPnLs = winningTrades.map(trade => this.calculateTradePnL(trade));
    const lossPnLs = losingTrades.map(trade => this.calculateTradePnL(trade));

    const totalWinAmount = winPnLs.reduce((sum, pnl) => sum + pnl, 0);
    const totalLossAmount = lossPnLs.reduce((sum, pnl) => sum + Math.abs(pnl), 0);

    return {
      totalPnL,
      totalVolume,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: pnlTrades.length > 0 ? (winningTrades.length / pnlTrades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0,
      biggestWin: winPnLs.length > 0 ? Math.max(...winPnLs) : 0,
      biggestLoss: lossPnLs.length > 0 ? Math.min(...lossPnLs) : 0,
      profitFactor: totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 1 : 0,
      avgHoldTime: this.calculateAverageHoldTime(trades)
    };
  }

  async calculatePnLBreakdown(walletId: string, filters?: TradeFilter): Promise<PnLBreakdown> {
    const trades = await this.getFilteredTrades(walletId, filters);
    
    return {
      daily: this.calculateDailyPnL(trades),
      weekly: this.calculateWeeklyPnL(trades),
      monthly: this.calculateMonthlyPnL(trades)
    };
  }

  async getTokenPerformance(walletId: string, filters?: TradeFilter): Promise<TokenPerformance[]> {
    const trades = await this.getFilteredTrades(walletId, filters);
    
    // Group by token (considering both tokenIn and tokenOut)
    const tokenMap = new Map<string, any[]>();
    
    trades.forEach(trade => {
      const tokens = [trade.tokenIn, trade.tokenOut];
      tokens.forEach(token => {
        if (!tokenMap.has(token)) {
          tokenMap.set(token, []);
        }
        tokenMap.get(token)!.push(trade);
      });
    });

    const performance: TokenPerformance[] = [];
    
    for (const [tokenAddress, tokenTrades] of tokenMap) {
      const pnlTrades = tokenTrades.filter(trade => 
        trade.priceIn && trade.priceOut && 
        parseFloat(trade.amountIn) > 0 && parseFloat(trade.amountOut) > 0
      );

      if (pnlTrades.length === 0) continue;

      const totalPnL = pnlTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
      const totalVolume = pnlTrades.reduce((sum, trade) => 
        sum + (parseFloat(trade.amountIn) * parseFloat(trade.priceIn || '0')), 0
      );
      const winningTrades = pnlTrades.filter(trade => this.calculateTradePnL(trade) > 0);

      performance.push({
        tokenAddress,
        tokenSymbol: this.getTokenSymbol(tokenAddress), // TODO: Implement token symbol lookup
        totalPnL,
        totalVolume,
        tradeCount: pnlTrades.length,
        winRate: (winningTrades.length / pnlTrades.length) * 100,
        avgPnL: totalPnL / pnlTrades.length
      });
    }

    return performance.sort((a, b) => b.totalPnL - a.totalPnL);
  }

  private async getFilteredTrades(walletId: string, filters?: TradeFilter) {
    const whereCondition: any = {
      walletId,
      processed: true
    };

    if (filters) {
      if (filters.tokenAddress) {
        whereCondition.OR = [
          { tokenIn: filters.tokenAddress },
          { tokenOut: filters.tokenAddress }
        ];
      }
      
      if (filters.startDate && filters.endDate) {
        whereCondition.blockTime = {
          gte: filters.startDate,
          lte: filters.endDate
        };
      }
      
      if (filters.tradeType) {
        whereCondition.type = filters.tradeType;
      }
      
      if (filters.dex) {
        whereCondition.dex = filters.dex;
      }
    }

    return prisma.trade.findMany({
      where: whereCondition,
      orderBy: { blockTime: 'desc' }
    });
  }

  private calculateTradePnL(trade: any): number {
    if (!trade.priceIn || !trade.priceOut) return 0;
    
    const amountIn = parseFloat(trade.amountIn);
    const amountOut = parseFloat(trade.amountOut);
    const priceIn = parseFloat(trade.priceIn);
    const priceOut = parseFloat(trade.priceOut);
    const fees = parseFloat(trade.fees || '0');

    // Calculate P&L based on trade type
    if (trade.type === 'buy') {
      // Buying: spent USD/SOL to get token, P&L = current_value - cost
      const cost = amountIn * priceIn + fees;
      const currentValue = amountOut * priceOut;
      return currentValue - cost;
    } else if (trade.type === 'sell') {
      // Selling: sold token for USD/SOL, P&L = received - cost_basis
      const received = amountOut * priceOut - fees;
      const costBasis = amountIn * priceIn;
      return received - costBasis;
    }
    
    // For swaps, calculate based on USD value difference
    const valueIn = amountIn * priceIn;
    const valueOut = amountOut * priceOut;
    return valueOut - valueIn - fees;
  }

  private calculateDailyPnL(trades: any[]) {
    const dailyMap = new Map<string, { pnl: number; volume: number; trades: number }>();
    
    trades.forEach(trade => {
      const date = format(new Date(trade.blockTime), 'yyyy-MM-dd');
      const pnl = this.calculateTradePnL(trade);
      const volume = parseFloat(trade.amountIn) * parseFloat(trade.priceIn || '0');
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { pnl: 0, volume: 0, trades: 0 });
      }
      
      const day = dailyMap.get(date)!;
      day.pnl += pnl;
      day.volume += volume;
      day.trades += 1;
    });

    // Convert to array and add cumulative P&L
    let cumulativePnL = 0;
    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        cumulativePnL += data.pnl;
        return {
          date,
          pnl: data.pnl,
          volume: data.volume,
          trades: data.trades,
          cumulativePnL
        };
      });
  }

  private calculateWeeklyPnL(trades: any[]) {
    // Similar implementation to daily but grouped by week
    // Implementation details omitted for brevity
    return [];
  }

  private calculateMonthlyPnL(trades: any[]) {
    // Similar implementation to daily but grouped by month
    // Implementation details omitted for brevity
    return [];
  }

  private calculateAverageHoldTime(trades: any[]): number {
    // For now, return 0 as we need to implement position tracking
    // This will be enhanced in Phase 2 with trade grouping
    return 0;
  }

  private getTokenSymbol(tokenAddress: string): string {
    // TODO: Implement token symbol lookup from token registry
    // For now, return truncated address
    return tokenAddress.slice(0, 8);
  }

  private getEmptyMetrics(): TradeMetrics {
    return {
      totalPnL: 0,
      totalVolume: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      biggestWin: 0,
      biggestLoss: 0,
      profitFactor: 0,
      avgHoldTime: 0
    };
  }
}

export const analyticsService = new AnalyticsService();