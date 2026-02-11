'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { RefreshCw, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportTriggerProps {
  walletId: string;
  walletAddress: string;
  onImportComplete?: () => void;
}

interface ImportStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  total?: number;
  error?: string;
}

export function ImportTrigger({ walletId, walletAddress, onImportComplete }: ImportTriggerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const startImport = async () => {
    try {
      setIsImporting(true);
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start import');
      }

      const { jobId } = await response.json();
      setImportStatus({ 
        id: jobId, 
        status: 'PENDING', 
        progress: 0 
      });
      
      // Poll for status updates
      pollImportStatus(jobId);
      
      toast.success('Trade import started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start import');
      setIsImporting(false);
    }
  };

  const pollImportStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/import/${jobId}`);
      if (!response.ok) return;

      const status: ImportStatus = await response.json();
      setImportStatus(status);

      if (status.status === 'COMPLETED') {
        setIsImporting(false);
        toast.success('Trade import completed successfully');
        onImportComplete?.();
      } else if (status.status === 'FAILED') {
        setIsImporting(false);
        toast.error(`Import failed: ${status.error || 'Unknown error'}`);
      } else {
        // Continue polling
        setTimeout(() => pollImportStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('Error polling import status:', error);
      setTimeout(() => pollImportStatus(jobId), 5000); // Longer delay on error
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Trades
        </CardTitle>
        <CardDescription>
          Import trading history from {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isImporting && !importStatus && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will scan your wallet for DEX trades and calculate accurate P&L including fees.
            </p>
            <Button onClick={startImport} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Import
            </Button>
          </div>
        )}

        {importStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {importStatus.status === 'COMPLETED' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {importStatus.status === 'FAILED' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {['PENDING', 'PROCESSING'].includes(importStatus.status) && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              <span className="font-medium">
                {importStatus.status === 'PENDING' && 'Preparing import...'}
                {importStatus.status === 'PROCESSING' && 'Importing trades...'}
                {importStatus.status === 'COMPLETED' && 'Import completed'}
                {importStatus.status === 'FAILED' && 'Import failed'}
              </span>
            </div>

            {importStatus.status === 'PROCESSING' && (
              <div className="space-y-2">
                <Progress value={importStatus.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {importStatus.progress}% complete
                  {importStatus.total && ` (${importStatus.progress}/${importStatus.total} trades)`}
                </p>
              </div>
            )}

            {importStatus.status === 'FAILED' && importStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{importStatus.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportStatus(null);
                    setIsImporting(false);
                  }}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {importStatus.status === 'COMPLETED' && (
              <Button
                variant="outline"
                onClick={() => {
                  setImportStatus(null);
                  setIsImporting(false);
                }}
                className="w-full"
              >
                Import More Trades
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}