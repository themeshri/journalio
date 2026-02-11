import { requireAuth } from '@/lib/auth';
import { AddWalletForm } from '@/components/wallet/add-wallet-form';

export default async function AddWalletPage() {
  await requireAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Wallet</h1>
        <p className="text-muted-foreground">
          Add a Solana wallet address to start importing your trading history.
        </p>
      </div>
      
      <AddWalletForm />
    </div>
  );
}