"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download,
  Loader2,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatus {
  status: 'never_synced' | 'in_progress' | 'success' | 'failed';
  lastSyncTime: string | null;
  totalSynced: number;
  errorMessage?: string;
}

interface SyncResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  duplicates: number;
  errors: string[];
  message: string;
}

interface OKXSyncDashboardProps {
  walletId: string;
  walletAddress: string;
}

export function OKXSyncDashboard({ walletId, walletAddress }: OKXSyncDashboardProps) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncStatus();
  }, [walletId]);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/okx/sync?walletId=${walletId}`);
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setLastResult(null);
    
    try {
      const res = await fetch('/api/okx/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletId, 
          walletAddress,
          syncType: '24h'
        })
      });

      const data = await res.json();
      setLastResult(data);
      
      if (data.success) {
        await fetchSyncStatus();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setLastResult({
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        duplicates: 0,
        errors: ['Network error. Please try again.'],
        message: 'Sync failed due to network error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    setAutoSync(enabled);
    // TODO: Implement auto-sync toggle API call
  };

  const getStatusBadge = () => {
    if (syncing) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Syncing
        </Badge>
      );
    }

    switch (status?.status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Never Synced
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>OKX Transaction Sync</CardTitle>
            <CardDescription>
              Import transactions from OKX Web3 API
            </CardDescription>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            size="sm"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            {getStatusBadge()}
          </div>

          {status && status.status !== 'never_synced' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-sm font-medium">
                  {status.lastSyncTime 
                    ? formatDistanceToNow(new Date(status.lastSyncTime), { addSuffix: true })
                    : 'Never'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transactions Synced</span>
                <span className="text-sm font-medium">{status.totalSynced || 0}</span>
              </div>

              {status.errorMessage && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Last Sync Error
                      </h3>
                      <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {status.errorMessage}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Last Sync Result */}
        {lastResult && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Last Sync Result</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fetched</p>
                  <p className="text-2xl font-bold">{lastResult.totalFetched}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {lastResult.totalSaved}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {lastResult.duplicates}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {lastResult.errors.length}
                  </p>
                </div>
              </div>

              {lastResult.message && (
                <div className={`rounded-lg p-3 ${
                  lastResult.success 
                    ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                }`}>
                  <div className="flex">
                    {lastResult.success ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                    )}
                    <p className="ml-2 text-sm">{lastResult.message}</p>
                  </div>
                </div>
              )}

              {lastResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Errors:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {lastResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="truncate">• {error}</li>
                    ))}
                    {lastResult.errors.length > 5 && (
                      <li>• ... and {lastResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* Auto-Sync Section */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync" className="text-base">
              Auto-Sync Every 24 Hours
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically fetch new transactions daily
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={handleAutoSyncToggle}
            disabled
          />
        </div>

        {/* Info Section */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
          <div className="flex">
            <Activity className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="ml-3 space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Sync Information
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Fetches transactions from the last 24 hours</li>
                <li>• Rate limited to 1 request per second</li>
                <li>• Automatically detects and skips duplicates</li>
                <li>• Supports Solana chain (Chain ID: 501)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}