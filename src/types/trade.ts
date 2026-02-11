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
  editableFields?: string[];
}

export interface TokenTransfer {
  mint: string;
  amount: string;
  decimals: number;
  direction: 'in' | 'out';
}

// Trade source enum
export enum TradeSource {
  IMPORTED = 'imported',
  MANUAL = 'manual'
}

// Trade action types for audit logging
export enum TradeActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ARCHIVE = 'archive',
  RESTORE = 'restore'
}

// Manual trade input interface
export interface ManualTradeInput {
  signature?: string;
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
  notes?: string;
  walletId: string;
}

// Trade editing interface
export interface TradeEditInput {
  id: string;
  type?: 'buy' | 'sell' | 'swap';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  priceIn?: string;
  priceOut?: string;
  dex?: string;
  fees?: string;
  blockTime?: Date;
  notes?: string;
  reason?: string; // Reason for edit
}

// Trade validation interface
export interface TradeValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Comprehensive trade form data interface
export interface TradeFormData {
  signature?: string;
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
  slot?: string;
  notes?: string;
  walletId: string;
  isDraft?: boolean;
}