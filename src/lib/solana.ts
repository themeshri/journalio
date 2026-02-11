import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class SolanaClient {
  private connections: Connection[];
  private currentConnectionIndex = 0;

  constructor(rpcUrls: string[]) {
    this.connections = rpcUrls.map(url => new Connection(url, 'confirmed'));
  }

  private getConnection(): Connection {
    return this.connections[this.currentConnectionIndex];
  }

  private async withFallback<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.connections.length; i++) {
      try {
        const connection = this.connections[(this.currentConnectionIndex + i) % this.connections.length];
        const result = await operation(connection);
        this.currentConnectionIndex = (this.currentConnectionIndex + i) % this.connections.length;
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`RPC ${i} failed:`, error);
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }

  async getSignaturesForAddress(
    address: PublicKey,
    options?: { before?: string; limit?: number }
  ): Promise<ConfirmedSignatureInfo[]> {
    return this.withFallback(connection =>
      connection.getSignaturesForAddress(address, {
        before: options?.before,
        limit: options?.limit || 100
      })
    );
  }

  async getTransaction(signature: string) {
    return this.withFallback(connection =>
      connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      })
    );
  }

  async getTokenAccountsByOwner(owner: PublicKey) {
    return this.withFallback(connection =>
      connection.getTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID
      })
    );
  }
}

// Initialize with multiple RPC endpoints for reliability
export const solanaClient = new SolanaClient([
  process.env.SOLANA_RPC_URL_PRIMARY || 'https://api.mainnet-beta.solana.com',
  process.env.SOLANA_RPC_URL_SECONDARY || 'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
]);