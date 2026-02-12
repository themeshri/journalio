import { Prisma } from '@prisma/client';
import { OKXTransaction } from './okx-client';

export class OKXTransactionTransformer {
  /**
   * Transform OKX transaction to Journalio Trade format
   */
  async transformToTrade(
    okxTx: OKXTransaction,
    walletId: string,
    walletAddress: string
  ): Promise<Prisma.TradeCreateInput> {
    // Determine if this is incoming or outgoing based on wallet address
    const isIncoming = okxTx.to?.[0]?.address?.toLowerCase() === walletAddress.toLowerCase();
    const isOutgoing = okxTx.from?.[0]?.address?.toLowerCase() === walletAddress.toLowerCase();
    
    // Determine trade type based on direction and transaction type
    let type: 'BUY' | 'SELL';
    let tokenIn: string;
    let tokenOut: string;
    
    if (okxTx.itype === '0') {
      // Native SOL transfer
      if (isIncoming) {
        type = 'BUY';
        tokenIn = 'SOL';
        tokenOut = 'SOL'; // SOL received
      } else {
        type = 'SELL';
        tokenIn = 'SOL'; // SOL sent
        tokenOut = 'SOL';
      }
    } else if (okxTx.itype === '2') {
      // Token transfer
      const tokenSymbol = okxTx.symbol || 'UNKNOWN';
      
      if (isIncoming) {
        // Received tokens - consider it a BUY
        type = 'BUY';
        tokenIn = 'SOL'; // Assume bought with SOL
        tokenOut = tokenSymbol;
      } else {
        // Sent tokens - consider it a SELL
        type = 'SELL';
        tokenIn = tokenSymbol;
        tokenOut = 'SOL'; // Assume sold for SOL
      }
    } else {
      // Unknown transaction type - default to BUY
      type = 'BUY';
      tokenIn = 'UNKNOWN';
      tokenOut = okxTx.symbol || 'UNKNOWN';
    }
    
    // Parse amount
    const amount = this.parseAmount(okxTx.amount, okxTx.symbol);
    
    // Parse transaction time
    const txTime = new Date(parseInt(okxTx.txTime));
    
    // Build the trade object
    const trade: Prisma.TradeCreateInput = {
      wallet: {
        connect: { id: walletId }
      },
      type,
      signature: okxTx.txHash,
      tokenIn,
      tokenOut,
      amountIn: new Prisma.Decimal(amount),
      amountOut: new Prisma.Decimal(0), // Will need price data to calculate
      priceIn: null, // Can be fetched from price service later
      priceOut: null, // Can be fetched from price service later
      fees: new Prisma.Decimal(okxTx.txFee || 0),
      blockTime: txTime,
      source: 'IMPORTED',
      dataSource: 'okx',
      okxTxHash: okxTx.txHash,
      okxImportedAt: new Date(),
      okxRawData: okxTx as unknown as Prisma.JsonValue,
      originalData: okxTx as unknown as Prisma.JsonValue,
      processed: true,
      isEditable: true,
      notes: `Imported from OKX - ${okxTx.symbol || 'Unknown'} ${isIncoming ? 'received' : 'sent'}`
    };
    
    // Add DEX if it's a swap (can be enhanced with more logic)
    if (okxTx.methodId) {
      trade.dex = 'Unknown DEX';
    }
    
    return trade;
  }
  
  /**
   * Parse amount string to number, handling different decimal places
   */
  private parseAmount(amount: string, symbol?: string): string {
    if (!amount || amount === '') return '0';
    
    try {
      // Remove any non-numeric characters except decimal point
      const cleanAmount = amount.replace(/[^0-9.]/g, '');
      
      // Parse to number
      const numAmount = parseFloat(cleanAmount);
      
      if (isNaN(numAmount)) return '0';
      
      // For SOL and most tokens, the amount is already in the correct decimal format
      // OKX typically returns amounts with proper decimals already applied
      return numAmount.toString();
    } catch (error) {
      console.error('Error parsing amount:', amount, error);
      return '0';
    }
  }
  
  /**
   * Batch transform multiple OKX transactions
   */
  async transformBatch(
    okxTransactions: OKXTransaction[],
    walletId: string,
    walletAddress: string
  ): Promise<Prisma.TradeCreateInput[]> {
    const trades: Prisma.TradeCreateInput[] = [];
    
    for (const okxTx of okxTransactions) {
      try {
        const trade = await this.transformToTrade(okxTx, walletId, walletAddress);
        trades.push(trade);
      } catch (error) {
        console.error(`Failed to transform transaction ${okxTx.txHash}:`, error);
        // Continue with other transactions even if one fails
      }
    }
    
    return trades;
  }
  
  /**
   * Check if a transaction already exists in the database
   */
  static buildDuplicateCheck(okxTxHash: string): Prisma.TradeWhereInput {
    return {
      OR: [
        { okxTxHash },
        { signature: okxTxHash }
      ]
    };
  }
}