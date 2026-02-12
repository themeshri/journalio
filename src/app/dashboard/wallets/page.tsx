'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wallet, ExternalLink, RefreshCw, Trash2, AlertCircle, Copy, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WalletData {
  id: string;
  address: string;
  label: string | null;
  chain: string;
  isActive: boolean;
  lastSync?: string;
  tradeCount?: number;
  totalVolume?: number;
  pnl?: number;
  createdAt: string;
  updatedAt: string;
}

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWallet, setNewWallet] = useState({
    address: '',
    label: '',
    chain: 'SOLANA'
  });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wallets');
      if (response.ok) {
        const data = await response.json();
        setWallets(data || []);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (walletId: string) => {
    try {
      setSyncingWalletId(walletId);
      
      // Find the wallet to get its address
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        toast.error('Wallet not found');
        return;
      }

      const response = await fetch('/api/okx/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletId: wallet.id,
          walletAddress: wallet.address,
          syncType: '24h'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(result.message || 'Sync completed successfully');
        } else {
          toast.error(result.message || 'Sync failed');
        }
        // Reload wallets to get updated sync status
        await loadWallets();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start sync');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync wallet');
    } finally {
      setSyncingWalletId(null);
    }
  };

  const handleDelete = async (walletId: string) => {
    if (!confirm('Are you sure you want to remove this wallet? This will also delete all associated trades and data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/wallets?id=${walletId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Wallet removed successfully');
        await loadWallets();
      } else {
        toast.error('Failed to remove wallet');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove wallet');
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.address.trim()) {
      toast.error('Wallet address is required');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: newWallet.address.trim(),
          label: newWallet.label.trim() || null,
          chain: newWallet.chain
        })
      });

      if (response.ok) {
        toast.success('Wallet added successfully');
        setNewWallet({ address: '', label: '', chain: 'SOLANA' });
        setShowAddForm(false);
        await loadWallets();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add wallet');
      }
    } catch (error) {
      console.error('Add wallet error:', error);
      toast.error('Failed to add wallet');
    } finally {
      setIsAdding(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'SOLANA':
        return 'bg-purple-100 text-purple-800';
      case 'BASE':
        return 'bg-blue-100 text-blue-800';
      case 'BSC':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
          <p className="text-muted-foreground">
            Manage your connected wallets and sync trading data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showAddForm ? "outline" : "default"}
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) {
                setNewWallet({ address: '', label: '', chain: 'SOLANA' });
              }
            }}
          >
            {showAddForm ? (
              <X className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {showAddForm ? 'Cancel' : 'Add Wallet'}
          </Button>
        </div>
      </div>

      {/* Add Wallet Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Wallet</CardTitle>
            <CardDescription>
              Add a wallet address to start tracking your trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Wallet Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter wallet address"
                    value={newWallet.address}
                    onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                    disabled={isAdding}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chain">Chain</Label>
                  <Select 
                    value={newWallet.chain} 
                    onValueChange={(value) => setNewWallet({ ...newWallet, chain: value })}
                  >
                    <SelectTrigger id="chain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOLANA">Solana</SelectItem>
                      <SelectItem value="BASE">Base</SelectItem>
                      <SelectItem value="BSC">BSC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="Enter a label for this wallet"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                  disabled={isAdding}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isAdding ? 'Adding...' : 'Add Wallet'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWallet({ address: '', label: '', chain: 'SOLANA' });
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {wallets.length === 0 && !isLoading && !showAddForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No wallets added</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Add your first wallet to start tracking your trades
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <Card className="col-span-full">
              <CardContent className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : (
            wallets.map((wallet) => (
              <Card key={wallet.id} className="relative">
                {!wallet.isActive && (
                  <Badge variant="secondary" className="absolute top-4 right-4">
                    Inactive
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {wallet.label || `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getChainColor(wallet.chain)}>
                          {wallet.chain}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAddress(wallet.address)}
                    >
                      {copiedAddress === wallet.address ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Trades</p>
                      <p className="text-lg font-semibold">{wallet.tradeCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-sm">
                        {wallet.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  {wallet.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {format(new Date(wallet.lastSync), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSync(wallet.id)}
                      disabled={syncingWalletId === wallet.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncingWalletId === wallet.id ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/wallet/${wallet.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(wallet.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Wallets are synced automatically every 24 hours. You can also manually sync to get the latest trades.
        </AlertDescription>
      </Alert>
    </div>
  );
}