import axios, { AxiosInstance } from 'axios';

interface OKXDEXQuote {
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols: string[];
}

export class OKXClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.okx.com/api/v5',
      headers: {
        'OK-ACCESS-KEY': process.env.OKX_API_KEY,
        'OK-ACCESS-SIGN': '', // Will be implemented for authenticated endpoints
        'OK-ACCESS-TIMESTAMP': '',
        'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
      },
    });
  }

  async getDEXQuote(params: {
    chainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
  }): Promise<OKXDEXQuote> {
    try {
      const response = await this.client.get('/dex/aggregator/quote', { params });
      return response.data.data[0];
    } catch (error) {
      console.error('OKX DEX quote error:', error);
      throw error;
    }
  }

  async getTokenPrices(tokenAddresses: string[], chainId = '501') {
    try {
      const response = await this.client.get('/market/token-price', {
        params: {
          chainId,
          tokenContractAddress: tokenAddresses.join(',')
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('OKX token prices error:', error);
      return [];
    }
  }
}

export const okxClient = new OKXClient();