'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Edit, Copy, AlertCircle, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceIn?: number;
  priceOut?: number;
  executedAt: string;
  dex: string;
  fees: number;
  walletId: string;
  notes?: string;
  isManual: boolean;
  mistakes?: Array<{
    id: string;
    mistakeType: string;
    severity: string;
    category?: {
      name: string;
      color: string;
    };
  }>;
}

interface Wallet {
  id: string;
  address: string;
  chain: string;
  label: string | null;
  isActive: boolean;
}

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'BUY' | 'SELL'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load trades and wallets in parallel
      const [tradesResponse, walletsResponse] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/wallets')
      ]);
      
      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        setTrades(tradesData.trades || []);
      }
      
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        setWallets(walletsData || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewTrades = async () => {
    if (wallets.length === 0) {
      alert('No wallets available. Please add a wallet first.');
      return;
    }

    setIsFetching(true);
    
    try {
      // Fetch from all wallets
      const results = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const response = await fetch('/api/okx/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletId: wallet.id,
                walletAddress: wallet.address,
                syncType: '24h'
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              return { wallet: wallet.label || wallet.address, ...result };
            } else {
              const error = await response.json();
              return { 
                wallet: wallet.label || wallet.address, 
                success: false, 
                error: error.error || 'Failed to sync'
              };
            }
          } catch (error) {
            return { 
              wallet: wallet.label || wallet.address, 
              success: false, 
              error: 'Network error'
            };
          }
        })
      );
      
      // Show results summary
      const successful = results.filter(r => r.success).length;
      const totalSaved = results.reduce((acc, r) => acc + (r.totalSaved || 0), 0);
      
      if (successful > 0) {
        alert(`✅ Successfully synced ${totalSaved} new transactions from ${successful}/${wallets.length} wallets`);
        // Reload trades to show new data
        loadData();
      } else {
        // Check if any results have a helpful configuration message
        const configMessage = results.find(r => r.message && r.message.includes('🔧'));
        if (configMessage) {
          alert(`⚙️ Configuration needed:\n\n${configMessage.message}`);
        } else {
          alert(`❌ Failed to sync from all wallets. Check console for details.`);
        }
      }
      
      console.log('OKX sync results:', results);
    } catch (error) {
      console.error('Failed to fetch new trades:', error);
      alert('❌ Failed to fetch new trades. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = searchQuery === '' ||
      trade.tokenIn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.tokenOut.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || trade.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getMistakeDisplay = (mistakes: Trade['mistakes']) => {
    if (!mistakes || mistakes.length === 0) return null;
    
    const highSeverity = mistakes.filter(m => m.severity === 'HIGH').length;
    const medSeverity = mistakes.filter(m => m.severity === 'MEDIUM').length;
    const lowSeverity = mistakes.filter(m => m.severity === 'LOW').length;

    return (
      <div className="flex items-center gap-2">
        {highSeverity > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {highSeverity} High
          </Badge>
        )}
        {medSeverity > 0 && (
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
            {medSeverity} Med
          </Badge>
        )}
        {lowSeverity > 0 && (
          <Badge variant="outline" className="text-xs">
            {lowSeverity} Low
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <p className="text-muted-foreground">
            Manage your trading history and journal entries
          </p>
          {wallets.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Connected wallets:</span>
              {wallets.map((wallet, index) => (
                <Badge key={wallet.id} variant="outline" className="text-xs">
                  {wallet.label || `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`}
                  {wallet.chain === 'SOLANA' && ' (SOL)'}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchNewTrades}
            disabled={isFetching || wallets.length === 0}
          >
            {isFetching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isFetching ? 'Fetching...' : 'Fetch New Trades'}
          </Button>
          <Button onClick={() => router.push('/dashboard/trades/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Trade
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Trades</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="BUY">Buys Only</SelectItem>
                  <SelectItem value="SELL">Sells Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No trades found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {wallets.length === 0 
                  ? 'Add a wallet first to start importing trades'
                  : 'Add your first trade or import from your wallet'
                }
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {wallets.length === 0 ? (
                  <Button onClick={() => router.push('/dashboard/wallets')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wallet
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={fetchNewTrades} disabled={isFetching}>
                      {isFetching ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isFetching ? 'Fetching...' : 'Fetch New Trades'}
                    </Button>
                    <Button onClick={() => router.push('/dashboard/trades/add')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manual Trade
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    trade.mistakes && trade.mistakes.length > 0 
                      ? "border-orange-200 bg-orange-50/50" 
                      : ""
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                      {trade.type}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {trade.amountIn} {trade.tokenIn} → {trade.amountOut} {trade.tokenOut}
                        </span>
                        {trade.isManual && (
                          <Badge variant="outline" className="text-xs">Manual</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(trade.executedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {trade.dex}
                        </span>
                        {getMistakeDisplay(trade.mistakes)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/trades/edit/${trade.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/trades/add?duplicate=${trade.id}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mistake Summary Card */}
      {trades.some(t => t.mistakes && t.mistakes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Mistake Tracking</CardTitle>
            <CardDescription>
              Review your trading mistakes to improve performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {trades.reduce((acc, t) => acc + (t.mistakes?.filter(m => m.severity === 'HIGH').length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">High Severity</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {trades.reduce((acc, t) => acc + (t.mistakes?.filter(m => m.severity === 'MEDIUM').length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Medium Severity</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {trades.reduce((acc, t) => acc + (t.mistakes?.filter(m => m.severity === 'LOW').length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Low Severity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}