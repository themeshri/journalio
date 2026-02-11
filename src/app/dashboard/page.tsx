import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WalletList } from '@/components/wallet/wallet-list';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function Dashboard() {
  const userId = await requireAuth();
  
  const walletsData = await prisma.wallet.findMany({
    where: { userId, isActive: true },
    include: {
      _count: {
        select: { trades: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const wallets = walletsData.map(wallet => ({
    id: wallet.id,
    address: wallet.address,
    chain: wallet.chain,
    label: wallet.label ?? undefined,
    _count: wallet._count
  }));

  if (wallets.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Welcome to ChainJournal</h2>
        <p className="text-muted-foreground mb-6">
          Get started by adding your first wallet address
        </p>
        <Link href="/dashboard/wallets/add">
          <Button>Add Wallet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <Link href="/dashboard/wallets/add">
          <Button>Add Wallet</Button>
        </Link>
      </div>

      <WalletList wallets={wallets} />
      
      {wallets.length > 1 && (
        <CombinedDashboard wallets={wallets} />
      )}
    </div>
  );
}