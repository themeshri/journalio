'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ExternalLink } from "lucide-react";
import { RemoveWalletDialog } from './remove-wallet-dialog';

interface WalletCardProps {
  wallet: {
    id: string;
    address: string;
    chain: string;
    label?: string;
    _count?: {
      trades: number;
    };
  };
  onRemove?: () => void;
}

export function WalletCard({ wallet, onRemove }: WalletCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const displayName = wallet.label || `Wallet ${wallet.address.slice(0, 8)}...`;
  const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-6)}`;
  const tradeCount = wallet._count?.trades ?? 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <CardDescription className="font-mono text-sm">
              {shortAddress}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/wallet/${wallet.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRemoveDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Trades: {tradeCount}</span>
            <span className="capitalize">{wallet.chain}</span>
          </div>
        </CardContent>
      </Card>

      <RemoveWalletDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        walletId={wallet.id}
        walletAddress={wallet.address}
        onSuccess={onRemove}
      />
    </>
  );
}