import { okxClient } from './okx-client';

export interface TokenPrice {
  mint: string;
  price: number;
  symbol?: string;
  lastUpdated: Date;
}

export class PriceService {
  private cache = new Map<string, TokenPrice>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current prices for tokens
   */
  async getPrices(tokenMints: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const uncachedMints: string[] = [];

    // Check cache first
    for (const mint of tokenMints) {
      const cached = this.cache.get(mint);
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_TTL) {
        prices[mint] = cached.price;
      } else {
        uncachedMints.push(mint);
      }
    }

    // Fetch uncached prices
    if (uncachedMints.length > 0) {
      try {
        const freshPrices = await okxClient.getTokenPrices(uncachedMints);
        
        for (const priceData of freshPrices) {
          const price = parseFloat(priceData.price);
          prices[priceData.tokenContractAddress] = price;
          
          // Update cache
          this.cache.set(priceData.tokenContractAddress, {
            mint: priceData.tokenContractAddress,
            price,
            symbol: priceData.symbol,
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
        // Return cached prices even if they're stale
        for (const mint of uncachedMints) {
          const cached = this.cache.get(mint);
          if (cached) {
            prices[mint] = cached.price;
          }
        }
      }
    }

    return prices;
  }

  /**
   * Get price for a single token
   */
  async getPrice(tokenMint: string): Promise<number | null> {
    const prices = await this.getPrices([tokenMint]);
    return prices[tokenMint] || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: Array<{ mint: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([mint, data]) => ({
      mint,
      age: now - data.lastUpdated.getTime()
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

export const priceService = new PriceService();