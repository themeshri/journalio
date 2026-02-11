'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TradeEditor } from '@/components/trades/trade-editor';
import { ArrowLeft, Edit, ExternalLink, Clock, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeSource } from '@/types/trade';
import { toast } from 'sonner';

interface TradeMetadata {
  id: string;
  signature: string;
  type: string;
  tokenIn: string;
  tokenOut: string;
  dex: string;
  blockTime: string;
  source: TradeSource;
  isEditable: boolean;
  lastModified: string;
  modifiedBy?: string;
  wallet: {
    address: string;
    label?: string;
  };
}

interface EditTradePageProps {
  params: Promise<{
    tradeId: string;
  }>;
}

export default function EditTradePage({ params }: EditTradePageProps) {
  const router = useRouter();
  const { tradeId } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeMetadata, setTradeMetadata] = useState<TradeMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load trade metadata
  useEffect(() => {
    loadTradeMetadata();
  }, [tradeId]);

  const loadTradeMetadata = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trades/${tradeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Trade not found');
        } else if (response.status === 403) {
          setError('You do not have permission to edit this trade');
        } else {
          setError('Failed to load trade data');
        }
        return;
      }

      const trade = await response.json();
      setTradeMetadata(trade);
    } catch (error) {
      console.error('Failed to load trade metadata:', error);
      setError('Failed to load trade data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Trade updated successfully');
    router.push('/dashboard/trades');
  };

  const handleCancel = () => {
    router.back();
  };

  const openBlockchainExplorer = () => {
    if (!tradeMetadata?.signature) return;
    
    // Open in Solscan (adjust URL pattern for other chains)
    const url = `https://solscan.io/tx/${tradeMetadata.signature}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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

  if (error || !tradeMetadata) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/trades">Trades</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Trade</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Error State */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Unable to load trade</p>
              <p>{error || 'An unexpected error occurred'}</p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/trades">Trades</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Trade</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
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
              <Edit className="w-7 h-7" />
              Edit Trade
            </h1>
            
            <div className="flex items-center gap-2">
              <Badge variant={tradeMetadata.source === TradeSource.IMPORTED ? 'secondary' : 'default'}>
                {tradeMetadata.source === TradeSource.IMPORTED ? 'Imported' : 'Manual'}
              </Badge>
              
              {!tradeMetadata.isEditable && (
                <Badge variant="destructive">
                  Restricted
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-lg text-muted-foreground">
              {tradeMetadata.type.charAt(0).toUpperCase() + tradeMetadata.type.slice(1)} • {' '}
              {tradeMetadata.tokenIn} → {tradeMetadata.tokenOut} • {' '}
              {tradeMetadata.dex}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(tradeMetadata.blockTime), 'PPpp')}
              </div>
              {tradeMetadata.wallet.label && (
                <span>Wallet: {tradeMetadata.wallet.label}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {tradeMetadata.signature && tradeMetadata.signature.length > 20 && (
            <Button
              variant="outline"
              size="sm"
              onClick={openBlockchainExplorer}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </Button>
          )}
        </div>
      </div>

      {/* Trade Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade Information</CardTitle>
          <CardDescription>
            Current trade details and metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trade ID</p>
              <p className="text-sm font-mono">{tradeMetadata.id.slice(-8)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signature</p>
              <p className="text-sm font-mono">
                {tradeMetadata.signature ? 
                  tradeMetadata.signature.slice(0, 8) + '...' + tradeMetadata.signature.slice(-8) :
                  'No signature'
                }
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wallet</p>
              <p className="text-sm">
                {tradeMetadata.wallet.label || 
                 tradeMetadata.wallet.address.slice(0, 8) + '...' + tradeMetadata.wallet.address.slice(-4)
                }
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Modified</p>
              <p className="text-sm">
                {format(new Date(tradeMetadata.lastModified), 'MMM dd, HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editing Restrictions Notice */}
      {tradeMetadata.source === TradeSource.IMPORTED && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Imported Trade Restrictions</p>
              <p className="text-sm">
                Some fields are protected to preserve data integrity. You can edit amounts, prices, 
                fees, and add notes, but core transaction details (tokens, signature, timestamp) cannot be changed.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!tradeMetadata.isEditable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Editing Disabled</p>
              <p className="text-sm">
                This trade cannot be edited. This may be due to system restrictions, 
                active positions, or administrative policies.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trade Editor */}
      <TradeEditor
        tradeId={tradeId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Help and Guidelines */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Editing Guidelines</CardTitle>
          <CardDescription>
            Best practices for trade modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Safe to Edit</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Trade amounts (quantities)</li>
                <li>• USD prices for better tracking</li>
                <li>• Fee amounts (gas + trading)</li>
                <li>• Notes and comments</li>
                <li>• DEX/exchange name</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-600">Edit with Caution</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Large amount changes</li>
                <li>• Price corrections</li>
                <li>• Trade type changes</li>
                <li>• Edits affecting positions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Protected Fields</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Transaction signature</li>
                <li>• Transaction timestamp</li>
                <li>• Token addresses (for imports)</li>
                <li>• Wallet assignment</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="font-medium">Remember:</span> All changes are logged in the audit trail. 
              Significant modifications may affect your position tracking and analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}