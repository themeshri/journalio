export interface ParsedTrade {
  signature: string;
  type: 'buy' | 'sell' | 'swap';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceIn?: string;
  priceOut?: string;
  dex: string;
  fees: string;
  blockTime: Date;
  slot: string;
  success: boolean;
  error?: string;
}

export interface TokenTransfer {
  mint: string;
  amount: string;
  decimals: number;
  direction: 'in' | 'out';
}