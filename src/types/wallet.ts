export interface Wallet {
  id: string;
  address: string;
  chain: string;
  label?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletRequest {
  address: string;
  label?: string;
  chain?: string;
}

export interface UpdateWalletRequest {
  label?: string;
  isActive?: boolean;
}