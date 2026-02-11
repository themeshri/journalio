'use client';

import { WalletCard } from './wallet-card';
import { useRouter } from 'next/navigation';

interface WalletListProps {
  wallets: Array<{
    id: string;
    address: string;
    chain: string;
    label?: string;
    _count?: {
      trades: number;
    };
  }>;
}

export function WalletList({ wallets }: WalletListProps) {
  const router = useRouter();

  const handleWalletRemove = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Wallets</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <WalletCard 
            key={wallet.id} 
            wallet={wallet} 
            onRemove={handleWalletRemove}
          />
        ))}
      </div>
    </div>
  );
}