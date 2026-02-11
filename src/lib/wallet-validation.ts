import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export const createWalletSchema = z.object({
  address: z.string().refine(isValidSolanaAddress, {
    message: "Invalid Solana wallet address"
  }),
  label: z.string().optional(),
  chain: z.string().default("solana")
});

export const updateWalletSchema = z.object({
  label: z.string().optional(),
  isActive: z.boolean().optional()
});