import axios, { AxiosInstance } from 'axios';

// Zerion API Types
export interface ZerionTransaction {
  id: string;
  type: 'transactions';
  attributes: {
    operation_type: 'trade' | 'send' | 'receive' | 'approve' | 'deposit' | 'withdraw';
    hash: string;
    mined_at: string;
    sent_at?: string;
    received_at?: string;
    status: 'confirmed' | 'pending' | 'failed';
    fee?: {
      value: number;
      price?: number;
      fungible_info?: ZerionToken;
      quantity?: ZerionQuantity;
    };
    transfers?: ZerionTransfer[];
    trades?: ZerionTrade[];
    value?: number;
    address: string;
    block_number?: number;
    nonce?: number;
  };
  relationships: {
    chain?: {
      data?: {
        id: string;
      };
    };
  };
}

export interface ZerionToken {
  id: string;
  name: string;
  symbol: string;
  icon?: {
    url: string;
  };
  flags?: {
    verified: boolean;
  };
  implementations?: Array<{
    chain_id: string;
    address: string;
    decimals: number;
  }>;
}

export interface ZerionQuantity {
  int: string;
  decimals: number;
  float: number;
  numeric: string;
}

export interface ZerionTransfer {
  direction: 'in' | 'out';
  fungible_info?: ZerionToken;
  nft_info?: any;
  quantity: ZerionQuantity;
  value?: number;
  price?: number;
}

export interface ZerionTrade {
  fungible_info_in?: ZerionToken;
  fungible_info_out?: ZerionToken;
  quantity_in?: ZerionQuantity;
  quantity_out?: ZerionQuantity;
  value_in?: number;
  value_out?: number;
}

export interface ZerionResponse {
  data: ZerionTransaction[];
  links?: {
    next?: string;
    prev?: string;
  };
  meta?: {
    total_count?: number;
  };
}

export interface ZerionFetchOptions {
  chainIds?: string[];
  currency?: string;
  pageSize?: number;
  pageAfter?: string;
  filterTrash?: 'no_filter' | 'only_trash' | 'exclude_trash';
  operationTypes?: string[];
}

export class ZerionClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ZERION_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Zerion API key is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.zerion.io/v1',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${this.apiKey}`,
      },
    });

    // Add request/response interceptors for logging and error handling
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Zerion] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Zerion] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[Zerion] Response: ${response.status} (${response.data?.data?.length || 0} items)`);
        return response;
      },
      (error) => {
        console.error('[Zerion] Response error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch transactions for a wallet with pagination support
   */
  async fetchTransactions(
    walletAddress: string, 
    options: ZerionFetchOptions = {}
  ): Promise<ZerionResponse> {
    const {
      chainIds = [],
      currency = 'usd',
      pageSize = 100,
      pageAfter = null,
      filterTrash = 'no_filter',
      operationTypes = []
    } = options;
    
    const params: Record<string, any> = {
      currency,
      'page[size]': pageSize,
      'filter[trash]': filterTrash
    };
    
    // Add optional parameters
    if (chainIds.length > 0) {
      chainIds.forEach(chainId => {
        params[`chain_ids[]`] = chainId;
      });
    }
    
    if (operationTypes.length > 0) {
      params['filter[operation_types]'] = operationTypes.join(',');
    }
    
    if (pageAfter) {
      params['page[after]'] = pageAfter;
    }
    
    try {
      const response = await this.client.get(`/wallets/${walletAddress}/transactions/`, {
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch all transactions with automatic pagination
   */
  async fetchAllTransactions(
    walletAddress: string, 
    options: ZerionFetchOptions = {}
  ): Promise<ZerionTransaction[]> {
    const allTransactions: ZerionTransaction[] = [];
    let pageAfter: string | null = null;
    let hasMore = true;
    let pageCount = 0;
    
    console.log(`[Zerion] Fetching all transactions for wallet: ${walletAddress}`);
    
    while (hasMore) {
      try {
        const response = await this.fetchTransactions(walletAddress, {
          ...options,
          pageAfter: pageAfter || undefined
        });
        
        pageCount++;
        const transactions = response.data || [];
        allTransactions.push(...transactions);
        
        console.log(`[Zerion] Page ${pageCount}: Fetched ${transactions.length} transactions (Total: ${allTransactions.length})`);
        
        // Check for next page
        if (response.links && response.links.next) {
          // Extract cursor from next link
          const nextUrl = new URL(response.links.next);
          pageAfter = nextUrl.searchParams.get('page[after]');
        } else {
          hasMore = false;
        }
        
        // Add delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        console.error(`[Zerion] Error fetching page ${pageCount + 1}:`, error);
        break;
      }
    }
    
    console.log(`[Zerion] Total transactions fetched: ${allTransactions.length}`);
    return allTransactions;
  }

  /**
   * Fetch transactions for the last 24 hours
   */
  async fetch24HourTransactions(walletAddress: string): Promise<ZerionTransaction[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Fetch recent transactions and filter by date
    const response = await this.fetchTransactions(walletAddress, {
      pageSize: 100,
      chainIds: ['solana'] // Focus on Solana for now
    });
    
    const recentTransactions = response.data.filter(tx => {
      const txDate = new Date(tx.attributes.mined_at);
      return txDate >= oneDayAgo;
    });
    
    console.log(`[Zerion] Found ${recentTransactions.length} transactions in last 24 hours`);
    return recentTransactions;
  }

  /**
   * Fetch transactions with date range filter
   */
  async fetchTransactionsByDateRange(
    walletAddress: string,
    startDate: Date,
    endDate: Date,
    options: ZerionFetchOptions = {}
  ): Promise<ZerionTransaction[]> {
    // Zerion doesn't have native date filtering, so we fetch all and filter locally
    const allTransactions = await this.fetchAllTransactions(walletAddress, options);
    
    return allTransactions.filter(tx => {
      const txDate = new Date(tx.attributes.mined_at);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use a known wallet address for testing
      const testWallet = 'FReKaCqfqYFGD3tqYCwSxwfWoSz2ey9qSPisDkaTj2mK';
      await this.fetchTransactions(testWallet, { pageSize: 1 });
      return true;
    } catch (error) {
      console.error('[Zerion] Connection test failed:', error);
      return false;
    }
  }
}

export const zerionClient = new ZerionClient();