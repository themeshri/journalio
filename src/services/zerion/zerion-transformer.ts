import { Prisma } from '@prisma/client';
import { ZerionTransaction, ZerionTransfer } from './zerion-client';

export interface TransformResult {
  trade: Prisma.TradeCreateInput;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export class ZerionTransactionTransformer {
  /**
   * Transform Zerion transaction to Journalio Trade format
   */
  async transformToTrade(
    zerionTx: ZerionTransaction,
    walletId: string,
    walletAddress: string
  ): Promise<TransformResult> {
    const { attributes, relationships } = zerionTx;
    const warnings: string[] = [];
    
    // Extract chain information
    const chain = relationships.chain?.data?.id || 'solana';
    
    // Parse transaction time
    const blockTime = new Date(attributes.mined_at);
    
    // Determine trade type and tokens based on operation type and transfers
    const tradeInfo = this.analyzeTradeType(attributes, walletAddress);
    
    if (tradeInfo.warnings.length > 0) {
      warnings.push(...tradeInfo.warnings);
    }
    
    // Apply cross-copy price logic for missing values
    const { tokenIn, tokenOut, amountIn, amountOut, priceIn, priceOut } = 
      this.applyCrossCopyPriceLogic(tradeInfo, attributes.transfers || []);
    
    // Calculate fees
    const fees = this.calculateFees(attributes.fee);
    
    // Determine confidence level early
    const confidence = this.assessTransformationConfidence(attributes, tradeInfo);
    
    // Build the trade object
    const trade: Prisma.TradeCreateInput = {
      wallet: {
        connect: { id: walletId }
      },
      type: tradeInfo.type,
      signature: attributes.hash,
      tokenIn,
      tokenOut,
      amountIn: new Prisma.Decimal(amountIn),
      amountOut: new Prisma.Decimal(amountOut),
      priceIn: priceIn ? new Prisma.Decimal(priceIn) : null,
      priceOut: priceOut ? new Prisma.Decimal(priceOut) : null,
      fees: new Prisma.Decimal(fees),
      blockTime,
      slot: attributes.block_number ? BigInt(attributes.block_number) : null,
      
      // Source tracking
      source: 'ZERION',
      dataSource: 'zerion',
      isEditable: true,
      processed: true,
      
      // Zerion specific fields
      zerionTxId: zerionTx.id,
      zerionOperationType: attributes.operation_type,
      zerionImportedAt: new Date(),
      zerionRawData: zerionTx as unknown as Prisma.JsonValue,
      zerionConfidence: confidence,
      originalData: zerionTx as unknown as Prisma.JsonValue,
      notes: this.generateTradeNotes(attributes, tradeInfo)
    };
    
    return {
      trade,
      confidence,
      warnings
    };
  }
  
  /**
   * Analyze transaction to determine trade type and token information
   */
  private analyzeTradeType(attributes: ZerionTransaction['attributes'], walletAddress: string) {
    const { operation_type, transfers = [] } = attributes;
    const warnings: string[] = [];
    
    let type: 'BUY' | 'SELL' = 'BUY';
    let tokenIn = 'UNKNOWN';
    let tokenOut = 'UNKNOWN';
    let dex = null;
    
    switch (operation_type) {
      case 'trade': {
        // Analyze transfers to determine trade direction
        const inTransfers = transfers.filter(t => t.direction === 'in');
        const outTransfers = transfers.filter(t => t.direction === 'out');
        
        if (inTransfers.length === 1 && outTransfers.length === 1) {
          // Simple swap
          const inToken = inTransfers[0].fungible_info?.symbol || 'UNKNOWN';
          const outToken = outTransfers[0].fungible_info?.symbol || 'UNKNOWN';
          
          // Determine if buying or selling based on token types
          if (this.isStablecoin(outToken) || outToken === 'SOL') {
            // Selling token for SOL/stablecoin
            type = 'SELL';
            tokenIn = inToken;
            tokenOut = outToken;
          } else {
            // Buying token with SOL/stablecoin
            type = 'BUY';
            tokenIn = outToken; // What we paid with
            tokenOut = inToken; // What we got
          }
        } else {
          warnings.push('Complex trade with multiple transfers detected');
          // Fallback logic for complex trades
          type = 'BUY';
          tokenIn = outTransfers[0]?.fungible_info?.symbol || 'UNKNOWN';
          tokenOut = inTransfers[0]?.fungible_info?.symbol || 'UNKNOWN';
        }
        break;
      }
      
      case 'send': {
        // Token sent - treat as SELL
        type = 'SELL';
        const sentTransfer = transfers.find(t => t.direction === 'out');
        tokenIn = sentTransfer?.fungible_info?.symbol || 'UNKNOWN';
        tokenOut = 'SOL'; // Assume sold for SOL
        break;
      }
      
      case 'receive': {
        // Token received - treat as BUY
        type = 'BUY';
        const receivedTransfer = transfers.find(t => t.direction === 'in');
        tokenIn = 'SOL'; // Assume bought with SOL
        tokenOut = receivedTransfer?.fungible_info?.symbol || 'UNKNOWN';
        break;
      }
      
      default: {
        warnings.push(`Unknown operation type: ${operation_type}`);
        type = 'BUY';
        tokenIn = 'UNKNOWN';
        tokenOut = 'UNKNOWN';
      }
    }
    
    return {
      type,
      tokenIn,
      tokenOut,
      dex,
      warnings
    };
  }
  
  /**
   * Apply cross-copy price logic to handle missing token prices
   */
  private applyCrossCopyPriceLogic(
    tradeInfo: ReturnType<typeof this.analyzeTradeType>, 
    transfers: ZerionTransfer[]
  ) {
    let amountIn = '0';
    let amountOut = '0';
    let priceIn: number | null = null;
    let priceOut: number | null = null;
    
    if (tradeInfo.type === 'BUY') {
      // Find the tokens in transfers
      const inTransfer = transfers.find(t => t.direction === 'in');
      const outTransfer = transfers.find(t => t.direction === 'out');
      
      if (inTransfer && outTransfer) {
        amountOut = inTransfer.quantity.numeric;
        amountIn = outTransfer.quantity.numeric;
        
        // Apply cross-copy logic for missing prices
        const inValue = inTransfer.value || 0;
        const outValue = outTransfer.value || 0;
        
        if (inValue > 0 && outValue === 0) {
          // Copy price from in to out
          priceOut = inTransfer.price || (inValue / parseFloat(amountOut));
          priceIn = outTransfer.price;
        } else if (outValue > 0 && inValue === 0) {
          // Copy price from out to in
          priceIn = outTransfer.price || (outValue / parseFloat(amountIn));
          priceOut = inTransfer.price;
        } else {
          // Both have prices or both missing
          priceIn = outTransfer.price;
          priceOut = inTransfer.price;
        }
      }
    } else {
      // SELL operation
      const inTransfer = transfers.find(t => t.direction === 'out'); // What we sold
      const outTransfer = transfers.find(t => t.direction === 'in'); // What we got
      
      if (inTransfer && outTransfer) {
        amountIn = inTransfer.quantity.numeric;
        amountOut = outTransfer.quantity.numeric;
        
        // Apply cross-copy logic
        const inValue = inTransfer.value || 0;
        const outValue = outTransfer.value || 0;
        
        if (inValue > 0 && outValue === 0) {
          priceIn = inTransfer.price || (inValue / parseFloat(amountIn));
          priceOut = outTransfer.price;
        } else if (outValue > 0 && inValue === 0) {
          priceOut = outTransfer.price || (outValue / parseFloat(amountOut));
          priceIn = inTransfer.price;
        } else {
          priceIn = inTransfer.price;
          priceOut = outTransfer.price;
        }
      }
    }
    
    return {
      tokenIn: tradeInfo.tokenIn,
      tokenOut: tradeInfo.tokenOut,
      amountIn: amountIn || '0',
      amountOut: amountOut || '0',
      priceIn,
      priceOut
    };
  }
  
  /**
   * Calculate fees from Zerion fee structure
   */
  private calculateFees(fee?: ZerionTransaction['attributes']['fee']): string {
    if (!fee || !fee.value) {
      return '0';
    }
    
    return fee.value.toString();
  }
  
  /**
   * Generate descriptive notes for the trade
   */
  private generateTradeNotes(
    attributes: ZerionTransaction['attributes'], 
    tradeInfo: ReturnType<typeof this.analyzeTradeType>
  ): string {
    const { operation_type, hash } = attributes;
    const notes = [
      `Imported from Zerion`,
      `Operation: ${operation_type}`,
      `Transaction: ${hash.substring(0, 8)}...`,
      `Type: ${tradeInfo.type} ${tradeInfo.tokenIn} → ${tradeInfo.tokenOut}`
    ];
    
    if (tradeInfo.warnings.length > 0) {
      notes.push(`Warnings: ${tradeInfo.warnings.join(', ')}`);
    }
    
    return notes.join(' | ');
  }
  
  /**
   * Assess confidence level of transformation
   */
  private assessTransformationConfidence(
    attributes: ZerionTransaction['attributes'],
    tradeInfo: ReturnType<typeof this.analyzeTradeType>
  ): 'high' | 'medium' | 'low' {
    const { operation_type, transfers = [] } = attributes;
    
    // High confidence for simple trades with clear direction
    if (operation_type === 'trade' && transfers.length === 2) {
      const hasValidTokens = tradeInfo.tokenIn !== 'UNKNOWN' && tradeInfo.tokenOut !== 'UNKNOWN';
      const hasValues = transfers.some(t => (t.value || 0) > 0);
      
      if (hasValidTokens && hasValues) {
        return 'high';
      }
    }
    
    // Medium confidence for sends/receives
    if (['send', 'receive'].includes(operation_type) && transfers.length === 1) {
      return 'medium';
    }
    
    // Low confidence for complex transactions or missing data
    return 'low';
  }
  
  /**
   * Check if token is a stablecoin
   */
  private isStablecoin(symbol: string): boolean {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'UST', 'FRAX'];
    return stablecoins.includes(symbol.toUpperCase());
  }
  
  /**
   * Transform multiple Zerion transactions
   */
  async transformBatch(
    zerionTransactions: ZerionTransaction[],
    walletId: string,
    walletAddress: string
  ): Promise<TransformResult[]> {
    const results: TransformResult[] = [];
    
    for (const zerionTx of zerionTransactions) {
      try {
        const result = await this.transformToTrade(zerionTx, walletId, walletAddress);
        results.push(result);
      } catch (error) {
        console.error(`Failed to transform transaction ${zerionTx.id}:`, error);
        // Continue with other transactions even if one fails
      }
    }
    
    return results;
  }
  
  /**
   * Build duplicate check query for Zerion transactions
   */
  static buildDuplicateCheck(zerionTxHash: string, zerionTxId?: string): Prisma.TradeWhereInput {
    const conditions: any[] = [
      { signature: zerionTxHash }
    ];

    if (zerionTxId) {
      conditions.push({ zerionTxId: zerionTxId });
    }

    return {
      OR: conditions
    };
  }
  
  /**
   * Extract trading statistics from Zerion transactions
   */
  getTransactionStats(transactions: ZerionTransaction[]) {
    const stats = {
      total_count: transactions.length,
      by_operation_type: {} as Record<string, number>,
      by_chain: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      total_fees: 0,
      total_value: 0,
      confidence_distribution: {
        high: 0,
        medium: 0,
        low: 0
      }
    };
    
    transactions.forEach(tx => {
      const { operation_type, status, fee } = tx.attributes;
      const chain = tx.relationships.chain?.data?.id || 'unknown';
      
      // Count by operation type
      stats.by_operation_type[operation_type] = (stats.by_operation_type[operation_type] || 0) + 1;
      
      // Count by chain
      stats.by_chain[chain] = (stats.by_chain[chain] || 0) + 1;
      
      // Count by status
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;
      
      // Sum fees
      if (fee?.value) {
        stats.total_fees += fee.value;
      }
    });
    
    return stats;
  }
}