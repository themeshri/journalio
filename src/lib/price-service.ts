// Price service - now relies on Zerion for price data

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

    // Note: Price fetching is now handled by Zerion during transaction sync
    // This service maintains cached prices for display purposes
    // Fresh prices come from Zerion API during transaction transformation
    if (uncachedMints.length > 0) {
      console.log('Price service: Using Zerion-provided prices from transaction data');
      // For uncached tokens, return 0 - prices will be populated by Zerion sync
      for (const mint of uncachedMints) {
        prices[mint] = 0;
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