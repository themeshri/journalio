'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ManualTradeForm } from '@/components/trades/manual-trade-form';
import { ArrowLeft, Plus, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DuplicateTradeData {
  id: string;
  type: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceIn?: string;
  priceOut?: string;
  dex: string;
  fees: string;
  notes?: string;
  walletId: string;
}

function AddTradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<DuplicateTradeData | null>(null);
  
  const duplicateTradeId = searchParams.get('duplicate');
  const walletId = searchParams.get('walletId');

  // Load trade data for duplication
  useEffect(() => {
    if (duplicateTradeId) {
      loadTradeForDuplication(duplicateTradeId);
    }
  }, [duplicateTradeId]);

  const loadTradeForDuplication = async (tradeId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trades/${tradeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load trade for duplication');
      }

      const trade = await response.json();
      setDuplicateFrom({
        id: trade.id,
        type: trade.type,
        tokenIn: trade.tokenIn,
        tokenOut: trade.tokenOut,
        amountIn: trade.amountIn.toString(),
        amountOut: trade.amountOut.toString(),
        priceIn: trade.priceIn?.toString(),
        priceOut: trade.priceOut?.toString(),
        dex: trade.dex,
        fees: trade.fees.toString(),
        notes: trade.notes,
        walletId: trade.walletId,
      });
      
      toast.success('Trade data loaded for duplication');
    } catch (error) {
      console.error('Failed to load trade for duplication:', error);
      toast.error('Failed to load trade data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Trade created successfully');
    router.push('/dashboard/trades');
  };

  const handleCancel = () => {
    router.back();
  };

  const clearDuplication = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('duplicate');
    router.push(url.pathname + (walletId ? `?walletId=${walletId}` : ''));
    setDuplicateFrom(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
        </Button>
        <span>/</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/trades')}
        >
          Trades
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">Add Trade</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Plus className="w-7 h-7" />
              Add Manual Trade
              {duplicateFrom && (
                <Badge variant="secondary" className="ml-2">
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicating
                </Badge>
              )}
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground">
            Add a trade that wasn't automatically imported or correct missing trade data
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {duplicateFrom && (
            <Button
              variant="outline"
              onClick={clearDuplication}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Fresh
            </Button>
          )}
        </div>
      </div>

      {/* Duplication Notice */}
      {duplicateFrom && (
        <Alert>
          <Copy className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Duplicating trade data</p>
              <div className="text-sm space-y-1">
                <p>• Type: {duplicateFrom.type}</p>
                <p>• Pair: {duplicateFrom.tokenIn} → {duplicateFrom.tokenOut}</p>
                <p>• DEX: {duplicateFrom.dex}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All fields have been pre-filled. You can modify any values before saving.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Manual Trade Guidelines</CardTitle>
          <CardDescription>
            Tips for adding accurate trade data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Required Information</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Trade type (buy/sell/swap)</li>
                <li>• Input and output tokens</li>
                <li>• Trade amounts</li>
                <li>• DEX or exchange used</li>
                <li>• Transaction date/time</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Optional but Recommended</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Token prices in USD</li>
                <li>• Transaction signature</li>
                <li>• Trading fees (gas + DEX)</li>
                <li>• Notes about strategy/reasoning</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Pro Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use draft saving for large imports</li>
                <li>• Include notes for future reference</li>
                <li>• Double-check amounts and decimals</li>
                <li>• Verify wallet assignment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Trade Form */}
      <ManualTradeForm
        walletId={walletId || duplicateFrom?.walletId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        draftKey={duplicateFrom ? `duplicate-${duplicateFrom.id}` : 'manual-trade-draft'}
      />

      {/* Quick Actions Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Need help with trade data?</p>
              <p className="text-xs text-muted-foreground">
                Check your DEX transaction history or blockchain explorer for accurate information
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://solscan.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Solscan
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://jup.ag" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Jupiter
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddTradePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <AddTradePageContent />
    </Suspense>
  );
}