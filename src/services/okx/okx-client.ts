import * as crypto from 'crypto';

export interface OKXTransactionResponse {
  code: string;
  msg: string;
  data: [{
    cursor?: string;
    transactions: OKXTransaction[];
  }];
}

export interface OKXTransaction {
  chainIndex: string;
  txHash: string;
  itype: string; // "0" = native transfer, "2" = token transfer
  methodId: string;
  nonce: string;
  txTime: string; // Unix timestamp in milliseconds
  from: Array<{
    address: string;
    amount: string;
  }>;
  to: Array<{
    address: string;
    amount: string;
  }>;
  tokenContractAddress: string;
  amount: string;
  symbol: string;
  txFee: string;
  txStatus: string; // "success" | "failed"
  hitBlacklist: boolean;
}

export class OKXClient {
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;
  private baseUrl = 'https://web3.okx.com';

  constructor() {
    this.apiKey = process.env.OKX_API_KEY!;
    this.secretKey = process.env.OKX_SECRET_KEY!;
    this.passphrase = process.env.OKX_PASSPHRASE!;
    
    if (!this.apiKey || !this.secretKey || !this.passphrase) {
      throw new Error('OKX API credentials not found in environment variables');
    }
  }

  /**
   * Generate signature for OKX API authentication
   */
  private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');
  }

  /**
   * Get required headers for OKX API requests
   */
  private getHeaders(method: string, requestPath: string, body: string = '') {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp, method, requestPath, body);

    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch transaction history for a wallet address
   */
  async fetchTransactionHistory(
    walletAddress: string,
    options: {
      limit?: number;
      cursor?: string;
      begin?: number;
      end?: number;
    } = {}
  ): Promise<OKXTransactionResponse> {
    const params = new URLSearchParams({
      address: walletAddress,
      chains: '501', // Solana chain ID
      limit: (options.limit || 50).toString(),
      ...(options.cursor && { cursor: options.cursor }),
      ...(options.begin && { begin: options.begin.toString() }),
      ...(options.end && { end: options.end.toString() }),
    });

    const requestPath = `/api/v6/dex/post-transaction/transactions-by-address?${params}`;
    const headers = this.getHeaders('GET', requestPath);

    const response = await fetch(`${this.baseUrl}${requestPath}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OKX API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    
    if (data.code !== '0' && data.code !== 0) {
      throw new Error(`OKX API returned error: ${data.msg || 'Unknown error'}`);
    }

    return data as OKXTransactionResponse;
  }

  /**
   * Fetch all transactions from the past 24 hours
   */
  async fetch24HourHistory(walletAddress: string): Promise<OKXTransaction[]> {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    let allTransactions: OKXTransaction[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const response = await this.fetchTransactionHistory(walletAddress, {
        cursor,
        begin: twentyFourHoursAgo,
        end: now,
        limit: 50
      });

      if (response.data?.[0]?.transactions) {
        const transactions = response.data[0].transactions;
        
        // Filter for 24h window
        const validTxs = transactions.filter(tx => {
          const txTime = parseInt(tx.txTime);
          return txTime >= twentyFourHoursAgo && txTime <= now;
        });
        
        allTransactions = allTransactions.concat(validTxs);
        cursor = response.data[0].cursor;
        
        // Check if we should continue
        hasMore = transactions.length === 50 && 
                 !transactions.some(tx => parseInt(tx.txTime) < twentyFourHoursAgo);
      } else {
        hasMore = false;
      }
      
      // Rate limit: 1 second delay between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return allTransactions;
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchTransactionHistory('test', { limit: 1 });
      return true;
    } catch (error) {
      // 404 is expected for invalid address, but means API is working
      if (error instanceof Error && error.message.includes('404')) {
        return true;
      }
      // 401 means authentication failed
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Invalid OKX API credentials');
      }
      throw error;
    }
  }
}