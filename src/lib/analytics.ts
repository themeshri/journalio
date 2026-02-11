import { prisma } from './db';
import { TradeMetrics, PnLBreakdown, TokenPerformance, TradeFilter } from '@/types/analytics';
import { Position, PositionMetrics, PositionFilter, TradeForPosition, PositionSummary } from '@/types/position';
import { calculateFIFOPositions, groupTradesIntoPositions } from './algorithms/position-tracker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export class AnalyticsService {
  async calculateWalletMetrics(walletId: string, filters?: TradeFilter): Promise<TradeMetrics> {
    const trades = await this.getFilteredTrades(walletId, filters);
    
    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const pnlTrades = trades.filter(trade => 
      trade.priceIn && trade.priceOut && 
      parseFloat(trade.amountIn.toString()) > 0 && parseFloat(trade.amountOut.toString()) > 0
    );

    const winningTrades = pnlTrades.filter(trade => this.calculateTradePnL(trade) > 0);
    const losingTrades = pnlTrades.filter(trade => this.calculateTradePnL(trade) < 0);
    
    const totalPnL = pnlTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
    const totalVolume = pnlTrades.reduce((sum, trade) => 
      sum + (parseFloat(trade.amountIn.toString()) * parseFloat(trade.priceIn?.toString() || '0')), 0
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
      avgHoldTime: await this.calculateAverageHoldTime(trades)
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
        sum + (parseFloat(trade.amountIn.toString()) * parseFloat(trade.priceIn?.toString() || '0')), 0
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

  /**
   * Get position metrics for a specific wallet
   */
  async getPositionMetrics(walletId: string, filters?: PositionFilter): Promise<PositionMetrics> {
    const positions = await this.getPositionsForWallet(walletId, filters);
    
    if (positions.length === 0) {
      return this.getEmptyPositionMetrics();
    }

    const openPositions = positions.filter(p => p.status === 'open');
    const closedPositions = positions.filter(p => p.status === 'closed');
    
    const totalRealizedPnL = positions.reduce((sum, p) => sum + p.realizedPnL, 0);
    const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const totalFees = positions.reduce((sum, p) => sum + p.fees, 0);

    const profitablePositions = closedPositions.filter(p => p.realizedPnL > 0);
    const losingPositions = closedPositions.filter(p => p.realizedPnL < 0);

    // Calculate average position duration for closed positions
    const avgDurationHours = closedPositions.length > 0 
      ? closedPositions.reduce((sum, p) => {
          const duration = p.closeDate ? 
            (p.closeDate.getTime() - p.openDate.getTime()) / (1000 * 60 * 60) : 0;
          return sum + duration;
        }, 0) / closedPositions.length
      : 0;

    // Calculate average position size (in USD terms)
    const avgPositionSize = positions.length > 0
      ? positions.reduce((sum, p) => sum + (p.totalQuantity * p.avgEntryPrice), 0) / positions.length
      : 0;

    return {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalRealizedPnL,
      totalUnrealizedPnL,
      totalNetPnL: totalRealizedPnL + totalUnrealizedPnL,
      positionWinRate: closedPositions.length > 0 ? (profitablePositions.length / closedPositions.length) * 100 : 0,
      avgPositionDuration: avgDurationHours,
      avgPositionSize,
      largestWin: profitablePositions.length > 0 ? Math.max(...profitablePositions.map(p => p.realizedPnL)) : 0,
      largestLoss: losingPositions.length > 0 ? Math.min(...losingPositions.map(p => p.realizedPnL)) : 0,
      totalFees
    };
  }

  /**
   * Get open positions for a wallet
   */
  async getOpenPositions(walletId: string): Promise<Position[]> {
    return this.getPositionsForWallet(walletId, { status: 'open' });
  }

  /**
   * Get closed positions for a wallet
   */
  async getClosedPositions(walletId: string, filters?: PositionFilter): Promise<Position[]> {
    return this.getPositionsForWallet(walletId, { ...filters, status: 'closed' });
  }

  /**
   * Get positions by token symbol
   */
  async getPositionsBySymbol(walletId: string, symbol: string, filters?: PositionFilter): Promise<Position[]> {
    // Get wallet address for filtering
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return [];

    return this.getPositionsForWallet(walletId, { 
      ...filters, 
      tokenAddress: undefined // We'll filter by symbol instead
    }).then(positions => 
      positions.filter(p => p.symbol.toLowerCase() === symbol.toLowerCase())
    );
  }

  /**
   * Get position summaries grouped by token
   */
  async getPositionSummaries(walletId: string): Promise<PositionSummary[]> {
    const positions = await this.getPositionsForWallet(walletId);
    
    // Group positions by symbol
    const symbolGroups = positions.reduce((acc, position) => {
      if (!acc[position.symbol]) {
        acc[position.symbol] = [];
      }
      acc[position.symbol].push(position);
      return acc;
    }, {} as Record<string, Position[]>);

    const summaries: PositionSummary[] = [];

    for (const [symbol, tokenPositions] of Object.entries(symbolGroups)) {
      const openPositions = tokenPositions.filter(p => p.status === 'open');
      const closedPositions = tokenPositions.filter(p => p.status === 'closed');
      const profitablePositions = closedPositions.filter(p => p.realizedPnL > 0);
      
      const totalRealizedPnL = tokenPositions.reduce((sum, p) => sum + p.realizedPnL, 0);
      const totalUnrealizedPnL = tokenPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
      
      // Calculate average duration for closed positions
      const avgDuration = closedPositions.length > 0
        ? closedPositions.reduce((sum, p) => {
            const duration = p.closeDate ? 
              (p.closeDate.getTime() - p.openDate.getTime()) / (1000 * 60 * 60) : 0;
            return sum + duration;
          }, 0) / closedPositions.length
        : 0;

      // Calculate total volume (approximate using position size * average price)
      const totalVolume = tokenPositions.reduce((sum, p) => 
        sum + (p.totalQuantity * p.avgEntryPrice), 0
      );

      // Get token address from first position (assuming same token)
      const tokenAddress = ''; // We'd need to enhance position data to include token address

      summaries.push({
        symbol,
        tokenAddress,
        totalPositions: tokenPositions.length,
        openPositions: openPositions.length,
        totalRealizedPnL,
        totalUnrealizedPnL,
        winRate: closedPositions.length > 0 ? (profitablePositions.length / closedPositions.length) * 100 : 0,
        avgDuration,
        totalVolume
      });
    }

    return summaries.sort((a, b) => (b.totalRealizedPnL + b.totalUnrealizedPnL) - (a.totalRealizedPnL + a.totalUnrealizedPnL));
  }

  /**
   * Calculate positions from trades using FIFO algorithm
   */
  private async getPositionsForWallet(walletId: string, filters?: PositionFilter): Promise<Position[]> {
    // Get wallet address
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return [];

    // Get trades for position calculation
    const trades = await this.getTradesForPositions(walletId, filters);
    
    // Convert to TradeForPosition format
    const tradesForPosition: TradeForPosition[] = trades.map(trade => ({
      id: trade.id,
      signature: trade.signature,
      type: trade.type as 'buy' | 'sell' | 'swap',
      tokenIn: trade.tokenIn,
      tokenOut: trade.tokenOut,
      amountIn: parseFloat(trade.amountIn.toString()),
      amountOut: parseFloat(trade.amountOut.toString()),
      priceIn: trade.priceIn ? parseFloat(trade.priceIn.toString()) : undefined,
      priceOut: trade.priceOut ? parseFloat(trade.priceOut.toString()) : undefined,
      fees: parseFloat(trade.fees.toString()),
      blockTime: trade.blockTime,
      walletAddress: wallet.address
    }));

    // Calculate positions using FIFO algorithm
    const result = groupTradesIntoPositions(tradesForPosition, wallet.address);
    
    // Filter positions based on provided filters
    let positions = result.positions;
    
    if (filters) {
      if (filters.status) {
        positions = positions.filter(p => p.status === filters.status);
      }
      
      if (filters.startDate && filters.endDate) {
        positions = positions.filter(p => 
          p.openDate >= filters.startDate! && p.openDate <= filters.endDate!
        );
      }
      
      if (filters.minPnL !== undefined) {
        positions = positions.filter(p => 
          (p.realizedPnL + p.unrealizedPnL) >= filters.minPnL!
        );
      }
      
      if (filters.maxPnL !== undefined) {
        positions = positions.filter(p => 
          (p.realizedPnL + p.unrealizedPnL) <= filters.maxPnL!
        );
      }
    }

    return positions;
  }

  /**
   * Get trades formatted for position calculations
   */
  private async getTradesForPositions(walletId: string, filters?: PositionFilter) {
    const whereCondition: any = {
      walletId,
      processed: true
    };

    if (filters) {
      if (filters.startDate && filters.endDate) {
        whereCondition.blockTime = {
          gte: filters.startDate,
          lte: filters.endDate
        };
      }
    }

    return prisma.trade.findMany({
      where: whereCondition,
      orderBy: { blockTime: 'asc' } // Important: chronological order for FIFO
    });
  }

  private getEmptyPositionMetrics(): PositionMetrics {
    return {
      totalPositions: 0,
      openPositions: 0,
      closedPositions: 0,
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      totalNetPnL: 0,
      positionWinRate: 0,
      avgPositionDuration: 0,
      avgPositionSize: 0,
      largestWin: 0,
      largestLoss: 0,
      totalFees: 0
    };
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
    
    const amountIn = parseFloat(trade.amountIn.toString());
    const amountOut = parseFloat(trade.amountOut.toString());
    const priceIn = parseFloat(trade.priceIn.toString());
    const priceOut = parseFloat(trade.priceOut.toString());
    const fees = parseFloat((trade.fees || 0).toString());

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
      const volume = parseFloat(trade.amountIn.toString()) * parseFloat(trade.priceIn?.toString() || '0');
      
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

  private async calculateAverageHoldTime(trades: any[]): Promise<number> {
    if (trades.length === 0) return 0;
    
    // Get wallet ID from first trade to calculate positions
    const walletId = trades[0].walletId;
    if (!walletId) return 0;

    try {
      // Get closed positions for hold time calculation
      const closedPositions = await this.getClosedPositions(walletId);
      
      if (closedPositions.length === 0) return 0;

      const totalHoldTime = closedPositions.reduce((sum, position) => {
        if (position.closeDate) {
          const holdTimeHours = (position.closeDate.getTime() - position.openDate.getTime()) / (1000 * 60 * 60);
          return sum + holdTimeHours;
        }
        return sum;
      }, 0);

      return totalHoldTime / closedPositions.length;
    } catch (error) {
      // Fallback to 0 if position calculation fails
      return 0;
    }
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