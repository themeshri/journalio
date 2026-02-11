import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface WalletPageProps {
  params: { walletId: string };
}

export default async function WalletPage({ params }: WalletPageProps) {
  const userId = await requireAuth();
  
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: params.walletId,
      userId,
      isActive: true
    },
    include: {
      _count: {
        select: { trades: true }
      }
    }
  });

  if (!wallet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {wallet.label || `Wallet ${wallet.address.slice(0, 8)}...`}
          </h1>
          <p className="text-muted-foreground font-mono">
            {wallet.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Trades</CardTitle>
            <CardDescription>Number of imported trades</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wallet._count.trades}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>P&L</CardTitle>
            <CardDescription>Total profit/loss</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">-</p>
            <p className="text-sm text-muted-foreground">
              Available after trade import
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Sync</CardTitle>
            <CardDescription>Most recent trade import</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">Never</p>
            <p className="text-sm text-muted-foreground">
              Import trades to see data
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Your trading activity for this wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg mb-2">No trades imported yet</p>
            <p className="text-sm">
              Trade import functionality will be available in the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}