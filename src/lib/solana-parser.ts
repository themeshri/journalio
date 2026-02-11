import { Transaction, PublicKey } from '@solana/web3.js';
import { SolanaClient } from './solana';
import { ParsedTrade, TokenTransfer } from '@/types/trade';
import bs58 from 'bs58';

export class SolanaTransactionParser {
  private solanaClient: SolanaClient;

  constructor(solanaClient: SolanaClient) {
    this.solanaClient = solanaClient;
  }

  async parseWalletTransactions(
    walletAddress: string,
    beforeSignature?: string,
    limit = 50
  ): Promise<ParsedTrade[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.solanaClient.getSignaturesForAddress(publicKey, {
        before: beforeSignature,
        limit
      });

      const trades: ParsedTrade[] = [];

      for (const sigInfo of signatures) {
        // Skip failed transactions
        if (sigInfo.err) {
          continue;
        }

        try {
          const transaction = await this.solanaClient.getTransaction(sigInfo.signature);
          if (!transaction) continue;

          const parsedTrade = await this.parseTransaction(
            sigInfo.signature,
            transaction,
            walletAddress
          );

          if (parsedTrade) {
            trades.push(parsedTrade);
          }
        } catch (error) {
          console.error(`Error parsing transaction ${sigInfo.signature}:`, error);
          // Continue processing other transactions
        }
      }

      return trades;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  private async parseTransaction(
    signature: string,
    transaction: any,
    walletAddress: string
  ): Promise<ParsedTrade | null> {
    try {
      // Extract token transfers from transaction
      const transfers = this.extractTokenTransfers(transaction, walletAddress);
      
      if (transfers.length < 2) {
        return null; // Not a trade transaction
      }

      // Determine if this is a swap/trade
      const swapTransfer = this.identifySwapTransfer(transfers);
      if (!swapTransfer) {
        return null;
      }

      // Identify DEX from program interactions
      const dex = this.identifyDEX(transaction);

      // Calculate fees
      const fees = this.calculateTransactionFees(transaction);

      return {
        signature,
        type: this.determineTradeType(swapTransfer.tokenIn, swapTransfer.tokenOut),
        tokenIn: swapTransfer.tokenIn,
        tokenOut: swapTransfer.tokenOut,
        amountIn: swapTransfer.amountIn,
        amountOut: swapTransfer.amountOut,
        dex,
        fees: fees.toString(),
        blockTime: new Date(transaction.blockTime * 1000),
        slot: transaction.slot.toString(),
        success: true
      };
    } catch (error) {
      console.error(`Error parsing transaction ${signature}:`, error);
      return {
        signature,
        type: 'swap',
        tokenIn: '',
        tokenOut: '',
        amountIn: '0',
        amountOut: '0',
        dex: 'unknown',
        fees: '0',
        blockTime: new Date(transaction.blockTime * 1000),
        slot: transaction.slot.toString(),
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed'
      };
    }
  }

  private extractTokenTransfers(transaction: any, walletAddress: string): TokenTransfer[] {
    const transfers: TokenTransfer[] = [];
    
    try {
      const preTokenBalances = transaction.meta?.preTokenBalances || [];
      const postTokenBalances = transaction.meta?.postTokenBalances || [];

      // Find wallet's token account changes
      const walletPubkey = new PublicKey(walletAddress);
      
      for (let i = 0; i < preTokenBalances.length; i++) {
        const pre = preTokenBalances[i];
        const post = postTokenBalances.find((p: any) => p.accountIndex === pre.accountIndex);
        
        if (!post) continue;

        // Check if this account belongs to our wallet
        const accountOwner = transaction.transaction.message.accountKeys[pre.accountIndex]?.owner;
        if (accountOwner !== walletPubkey.toBase58()) continue;

        const preAmount = BigInt(pre.uiTokenAmount.amount);
        const postAmount = BigInt(post.uiTokenAmount.amount);
        const difference = postAmount - preAmount;

        if (difference !== 0n) {
          transfers.push({
            mint: pre.mint,
            amount: Math.abs(Number(difference)).toString(),
            decimals: pre.uiTokenAmount.decimals,
            direction: difference > 0n ? 'in' : 'out'
          });
        }
      }
    } catch (error) {
      console.error('Error extracting token transfers:', error);
    }

    return transfers;
  }

  private identifySwapTransfer(transfers: TokenTransfer[]): {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
  } | null {
    const inTransfers = transfers.filter(t => t.direction === 'in');
    const outTransfers = transfers.filter(t => t.direction === 'out');

    if (inTransfers.length !== 1 || outTransfers.length !== 1) {
      return null; // Complex transaction, skip for now
    }

    return {
      tokenIn: outTransfers[0].mint,
      tokenOut: inTransfers[0].mint,
      amountIn: outTransfers[0].amount,
      amountOut: inTransfers[0].amount
    };
  }

  private identifyDEX(transaction: any): string {
    const programIds = transaction.transaction.message.accountKeys
      .map((key: any) => key.pubkey || key)
      .filter((key: string) => key);

    // Known DEX program IDs
    const dexPrograms: Record<string, string> = {
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'jupiter',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'raydium',
      'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'orca',
      'PumpFun1111111111111111111111111111111112': 'pumpfun'
    };

    for (const programId of programIds) {
      if (dexPrograms[programId]) {
        return dexPrograms[programId];
      }
    }

    return 'unknown';
  }

  private determineTradeType(tokenIn: string, tokenOut: string): 'buy' | 'sell' | 'swap' {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

    const stablecoins = [USDC_MINT, USDT_MINT];
    
    if (stablecoins.includes(tokenIn) || tokenIn === SOL_MINT) {
      return 'buy'; // Buying token with stablecoin/SOL
    } else if (stablecoins.includes(tokenOut) || tokenOut === SOL_MINT) {
      return 'sell'; // Selling token for stablecoin/SOL
    }
    
    return 'swap'; // Token to token swap
  }

  private calculateTransactionFees(transaction: any): number {
    const fee = transaction.meta?.fee || 0;
    return fee / 1_000_000_000; // Convert lamports to SOL
  }

  private async parseFailedTransaction(
    signature: string,
    transaction: any
  ): Promise<ParsedTrade> {
    const errorInfo = this.extractTransactionError(transaction);
    
    return {
      signature,
      type: 'swap',
      tokenIn: '',
      tokenOut: '',
      amountIn: '0',
      amountOut: '0',
      dex: this.identifyDEX(transaction),
      fees: this.calculateTransactionFees(transaction).toString(),
      blockTime: new Date(transaction.blockTime * 1000),
      slot: transaction.slot.toString(),
      success: false,
      error: errorInfo
    };
  }

  private extractTransactionError(transaction: any): string {
    if (!transaction.meta?.err) return 'Transaction failed';
    
    const error = transaction.meta.err;
    
    // Common Solana error types
    if (typeof error === 'string') return error;
    if (error.InstructionError) {
      const [index, instructionError] = error.InstructionError;
      return `Instruction ${index} failed: ${JSON.stringify(instructionError)}`;
    }
    if (error.InsufficientFundsForFee) return 'Insufficient funds for transaction fee';
    if (error.AccountNotFound) return 'Required account not found';
    if (error.InvalidAccountData) return 'Invalid account data';
    
    return JSON.stringify(error);
  }
}