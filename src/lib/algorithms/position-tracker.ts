import { 
  Position, 
  PositionTrade, 
  TradeForPosition, 
  FIFOQueueItem, 
  PositionCalculationResult,
  PositionFilter 
} from '@/types/position';

/**
 * FIFO Position Tracker - IRS 2025 Compliant
 * 
 * Implements First-In-First-Out algorithm for position tracking.
 * Separates positions by token and wallet for accurate P&L calculation.
 */
export class FIFOPositionTracker {
  // Per-wallet, per-token FIFO queues
  private fifoQueues = new Map<string, Map<string, FIFOQueueItem[]>>();
  
  /**
   * Calculate FIFO positions from trades
   * Groups trades into positions and calculates P&L using FIFO methodology
   */
  public calculateFIFOPositions(
    trades: TradeForPosition[], 
    walletAddress: string
  ): PositionCalculationResult {
    const positions: Position[] = [];
    const positionTrades: PositionTrade[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Initialize wallet queue if not exists
      if (!this.fifoQueues.has(walletAddress)) {
        this.fifoQueues.set(walletAddress, new Map());
      }
      
      const walletQueues = this.fifoQueues.get(walletAddress)!;
      
      // Sort trades by timestamp for chronological processing
      const sortedTrades = [...trades].sort((a, b) => 
        a.blockTime.getTime() - b.blockTime.getTime()
      );
      
      // Process each trade
      for (const trade of sortedTrades) {
        try {
          const result = this.processTrade(trade, walletQueues, walletAddress);
          
          if (result.position) {
            positions.push(result.position);
          }
          
          if (result.positionTrades) {
            positionTrades.push(...result.positionTrades);
          }
          
          if (result.warnings) {
            warnings.push(...result.warnings);
          }
          
        } catch (error) {
          errors.push(`Error processing trade ${trade.signature}: ${error}`);
        }
      }
      
      // Create positions for remaining open holdings
      for (const [token, queue] of walletQueues) {
        if (queue.length > 0) {
          const openPosition = this.createOpenPosition(token, queue, walletAddress);
          if (openPosition) {
            positions.push(openPosition.position);
            positionTrades.push(...openPosition.positionTrades);
          }
        }
      }
      
    } catch (error) {
      errors.push(`Fatal error in FIFO calculation: ${error}`);
    }
    
    return {
      positions: this.consolidatePositions(positions),
      positionTrades,
      errors,
      warnings
    };
  }
  
  /**
   * Process individual trade using FIFO logic
   */
  private processTrade(
    trade: TradeForPosition, 
    walletQueues: Map<string, FIFOQueueItem[]>,
    walletAddress: string
  ): {
    position?: Position;
    positionTrades?: PositionTrade[];
    warnings?: string[];
  } {
    const warnings: string[] = [];
    
    // Determine primary token and trade direction
    const { token, quantity, price, isBuy } = this.parseTradeData(trade);
    
    if (!token || quantity <= 0) {
      warnings.push(`Invalid trade data for ${trade.signature}`);
      return { warnings };
    }
    
    // Initialize token queue if not exists
    if (!walletQueues.has(token)) {
      walletQueues.set(token, []);
    }
    
    const queue = walletQueues.get(token)!;
    
    if (isBuy) {
      // Buy trade: Add to FIFO queue
      return this.processBuyTrade(trade, queue, token, quantity, price, walletAddress);
    } else {
      // Sell trade: Remove from FIFO queue
      return this.processSellTrade(trade, queue, token, quantity, price, walletAddress);
    }
  }
  
  /**
   * Process buy trade - adds to FIFO queue
   */
  private processBuyTrade(
    trade: TradeForPosition,
    queue: FIFOQueueItem[],
    token: string,
    quantity: number,
    price: number,
    walletAddress: string
  ): {
    position?: Position;
    positionTrades?: PositionTrade[];
  } {
    // Add to queue
    const queueItem: FIFOQueueItem = {
      quantity,
      price,
      fees: trade.fees,
      tradeId: trade.id,
      timestamp: trade.blockTime
    };
    
    queue.push(queueItem);
    
    // For buy trades, we don't create a closed position yet
    // The position will be created when we sell or at the end for open positions
    const positionTrade: PositionTrade = {
      id: `pt_${trade.id}`,
      positionId: `pos_${token}_${walletAddress}`, // Temporary ID
      tradeId: trade.id,
      role: 'entry',
      quantity,
      price,
      fees: trade.fees,
      timestamp: trade.blockTime
    };
    
    return {
      positionTrades: [positionTrade]
    };
  }
  
  /**
   * Process sell trade - removes from FIFO queue and calculates P&L
   */
  private processSellTrade(
    trade: TradeForPosition,
    queue: FIFOQueueItem[],
    token: string,
    sellQuantity: number,
    sellPrice: number,
    walletAddress: string
  ): {
    position?: Position;
    positionTrades?: PositionTrade[];
    warnings?: string[];
  } {
    const warnings: string[] = [];
    const positionTrades: PositionTrade[] = [];
    
    if (queue.length === 0) {
      warnings.push(`Sell trade ${trade.signature} with no prior holdings - possible short position`);
      return { warnings };
    }
    
    let remainingSellQuantity = sellQuantity;
    let totalCostBasis = 0;
    let totalEntryQuantity = 0;
    let totalFees = trade.fees;
    let avgEntryPrice = 0;
    const usedQueueItems: FIFOQueueItem[] = [];
    
    // Process FIFO queue until sell quantity is satisfied
    while (remainingSellQuantity > 0 && queue.length > 0) {
      const queueItem = queue[0];
      
      if (queueItem.quantity <= remainingSellQuantity) {
        // Use entire queue item
        totalCostBasis += queueItem.quantity * queueItem.price;
        totalEntryQuantity += queueItem.quantity;
        totalFees += queueItem.fees;
        remainingSellQuantity -= queueItem.quantity;
        usedQueueItems.push(queue.shift()!);
      } else {
        // Partial use of queue item
        const partialQuantity = remainingSellQuantity;
        totalCostBasis += partialQuantity * queueItem.price;
        totalEntryQuantity += partialQuantity;
        totalFees += (queueItem.fees * partialQuantity) / queueItem.quantity; // Pro-rata fees
        
        // Update remaining quantity in queue
        queueItem.quantity -= partialQuantity;
        queueItem.fees -= (queueItem.fees * partialQuantity) / queueItem.quantity;
        
        usedQueueItems.push({
          quantity: partialQuantity,
          price: queueItem.price,
          fees: (queueItem.fees * partialQuantity) / queueItem.quantity,
          tradeId: queueItem.tradeId,
          timestamp: queueItem.timestamp
        });
        
        remainingSellQuantity = 0;
      }
    }
    
    if (remainingSellQuantity > 0) {
      warnings.push(`Sell quantity exceeds holdings for ${token} - ${remainingSellQuantity} tokens oversold`);
    }
    
    // Calculate position metrics
    avgEntryPrice = totalEntryQuantity > 0 ? totalCostBasis / totalEntryQuantity : 0;
    const totalSaleValue = (sellQuantity - remainingSellQuantity) * sellPrice;
    const realizedPnL = totalSaleValue - totalCostBasis - totalFees;
    
    // Create closed position
    const position: Position = {
      id: `pos_${token}_${Date.now()}`,
      symbol: this.getTokenSymbol(token),
      walletAddress,
      openDate: usedQueueItems[0]?.timestamp || trade.blockTime,
      closeDate: trade.blockTime,
      status: 'closed',
      totalQuantity: totalEntryQuantity,
      avgEntryPrice,
      avgExitPrice: sellPrice,
      realizedPnL,
      unrealizedPnL: 0,
      fees: totalFees,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create position trades for entries
    for (const queueItem of usedQueueItems) {
      positionTrades.push({
        id: `pt_entry_${queueItem.tradeId}_${position.id}`,
        positionId: position.id,
        tradeId: queueItem.tradeId,
        role: 'entry',
        quantity: queueItem.quantity,
        price: queueItem.price,
        fees: queueItem.fees,
        timestamp: queueItem.timestamp
      });
    }
    
    // Create position trade for exit
    positionTrades.push({
      id: `pt_exit_${trade.id}_${position.id}`,
      positionId: position.id,
      tradeId: trade.id,
      role: 'exit',
      quantity: sellQuantity - remainingSellQuantity,
      price: sellPrice,
      fees: trade.fees,
      timestamp: trade.blockTime
    });
    
    return {
      position,
      positionTrades,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  /**
   * Create open position from remaining queue items
   */
  private createOpenPosition(
    token: string, 
    queue: FIFOQueueItem[], 
    walletAddress: string
  ): {
    position: Position;
    positionTrades: PositionTrade[];
  } | null {
    if (queue.length === 0) return null;
    
    const totalQuantity = queue.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = queue.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalFees = queue.reduce((sum, item) => sum + item.fees, 0);
    const avgEntryPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const openDate = queue.reduce((earliest, item) => 
      item.timestamp < earliest ? item.timestamp : earliest, queue[0].timestamp
    );
    
    // For unrealized P&L, we'd need current prices - set to 0 for now
    const position: Position = {
      id: `pos_open_${token}_${Date.now()}`,
      symbol: this.getTokenSymbol(token),
      walletAddress,
      openDate,
      closeDate: undefined,
      status: 'open',
      totalQuantity,
      avgEntryPrice,
      avgExitPrice: undefined,
      realizedPnL: 0,
      unrealizedPnL: 0, // TODO: Calculate with current prices
      fees: totalFees,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const positionTrades: PositionTrade[] = queue.map(item => ({
      id: `pt_open_${item.tradeId}_${position.id}`,
      positionId: position.id,
      tradeId: item.tradeId,
      role: 'entry',
      quantity: item.quantity,
      price: item.price,
      fees: item.fees,
      timestamp: item.timestamp
    }));
    
    return { position, positionTrades };
  }
  
  /**
   * Parse trade data to extract token, quantity, price, and direction
   */
  private parseTradeData(trade: TradeForPosition): {
    token: string | null;
    quantity: number;
    price: number;
    isBuy: boolean;
  } {
    let token: string | null = null;
    let quantity = 0;
    let price = 0;
    let isBuy = false;
    
    if (trade.type === 'buy') {
      token = trade.tokenOut; // Token we're buying
      quantity = trade.amountOut;
      price = trade.priceOut || 0;
      isBuy = true;
    } else if (trade.type === 'sell') {
      token = trade.tokenIn; // Token we're selling
      quantity = trade.amountIn;
      price = trade.priceIn || 0;
      isBuy = false;
    } else if (trade.type === 'swap') {
      // For swaps, treat as sell tokenIn, buy tokenOut
      // We'll need to handle both sides - for now, focus on tokenOut
      token = trade.tokenOut;
      quantity = trade.amountOut;
      price = trade.priceOut || 0;
      isBuy = true;
    }
    
    return { token, quantity, price, isBuy };
  }
  
  /**
   * Consolidate positions with same token and wallet
   */
  private consolidatePositions(positions: Position[]): Position[] {
    // For now, return as-is. In future, we might want to consolidate
    // positions that were opened and closed multiple times
    return positions;
  }
  
  /**
   * Get token symbol from address (placeholder implementation)
   */
  private getTokenSymbol(tokenAddress: string): string {
    // TODO: Implement proper token symbol lookup
    const commonTokens: Record<string, string> = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    };
    
    return commonTokens[tokenAddress] || `${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`;
  }
}

/**
 * Group trades into positions using FIFO algorithm
 */
export function groupTradesIntoPositions(
  trades: TradeForPosition[], 
  walletAddress: string
): PositionCalculationResult {
  const tracker = new FIFOPositionTracker();
  return tracker.calculateFIFOPositions(trades, walletAddress);
}

/**
 * Calculate FIFO positions for multiple wallets
 */
export function calculateFIFOPositions(
  trades: TradeForPosition[]
): PositionCalculationResult {
  const allPositions: Position[] = [];
  const allPositionTrades: PositionTrade[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  // Group trades by wallet
  const tradesByWallet = trades.reduce((acc, trade) => {
    if (!acc[trade.walletAddress]) {
      acc[trade.walletAddress] = [];
    }
    acc[trade.walletAddress].push(trade);
    return acc;
  }, {} as Record<string, TradeForPosition[]>);
  
  // Process each wallet separately
  for (const [walletAddress, walletTrades] of Object.entries(tradesByWallet)) {
    const result = groupTradesIntoPositions(walletTrades, walletAddress);
    
    allPositions.push(...result.positions);
    allPositionTrades.push(...result.positionTrades);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }
  
  return {
    positions: allPositions,
    positionTrades: allPositionTrades,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Validate position grouping for manual adjustments
 */
export function validatePositionGrouping(
  trades: TradeForPosition[], 
  manualGrouping: Record<string, string[]>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check that all trades are accounted for
  const allTradeIds = trades.map(t => t.id);
  const groupedTradeIds = Object.values(manualGrouping).flat();
  
  const missingTrades = allTradeIds.filter(id => !groupedTradeIds.includes(id));
  const duplicateTrades = groupedTradeIds.filter((id, index) => 
    groupedTradeIds.indexOf(id) !== index
  );
  
  if (missingTrades.length > 0) {
    errors.push(`Missing trades in grouping: ${missingTrades.join(', ')}`);
  }
  
  if (duplicateTrades.length > 0) {
    errors.push(`Duplicate trades in grouping: ${duplicateTrades.join(', ')}`);
  }
  
  // Validate each position group
  for (const [positionId, tradeIds] of Object.entries(manualGrouping)) {
    const positionTrades = trades.filter(t => tradeIds.includes(t.id));
    
    // Check token consistency within position
    const tokens = new Set(positionTrades.flatMap(t => [t.tokenIn, t.tokenOut]));
    if (tokens.size > 2) {
      errors.push(`Position ${positionId} contains inconsistent tokens: ${Array.from(tokens).join(', ')}`);
    }
    
    // Check chronological order
    const sortedTrades = positionTrades.sort((a, b) => a.blockTime.getTime() - b.blockTime.getTime());
    const hasProperSequence = sortedTrades.every((trade, i) => {
      if (i === 0) return true;
      const prevTrade = sortedTrades[i - 1];
      return trade.blockTime >= prevTrade.blockTime;
    });
    
    if (!hasProperSequence) {
      errors.push(`Position ${positionId} has trades in non-chronological order`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}