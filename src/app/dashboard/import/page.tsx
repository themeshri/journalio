'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, AlertCircle, CheckCircle, XCircle, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface ImportStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  importedCount?: number;
  failedCount?: number;
}

export default function ImportPage() {
  const router = useRouter();
  const [importMethod, setImportMethod] = useState<'wallet' | 'csv' | 'api'>('wallet');
  const [walletAddress, setWalletAddress] = useState('');
  const [chain, setChain] = useState<'SOLANA' | 'BASE' | 'BSC'>('SOLANA');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ status: 'idle' });
  const [isImporting, setIsImporting] = useState(false);

  const handleWalletImport = async () => {
    if (!walletAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    try {
      setIsImporting(true);
      setImportStatus({ status: 'processing', message: 'Connecting to blockchain...' });

      // First, add the wallet if it doesn't exist
      const walletResponse = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          name: `${chain} Wallet`,
          chain,
        }),
      });

      if (!walletResponse.ok) {
        throw new Error('Failed to add wallet');
      }

      const { wallet } = await walletResponse.json();

      // Then start the import job
      setImportStatus({ status: 'processing', message: 'Starting trade import...' });
      
      const importResponse = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: wallet.id }),
      });

      if (!importResponse.ok) {
        throw new Error('Failed to start import');
      }

      const { jobId } = await importResponse.json();

      // Poll for import status
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const statusResponse = await fetch(`/api/import/${jobId}`);
          const status = await statusResponse.json();

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setImportStatus({
              status: 'success',
              message: 'Import completed successfully!',
              importedCount: status.importedCount || 0,
              failedCount: status.failedCount || 0,
            });
            toast.success(`Imported ${status.importedCount || 0} trades`);
            setTimeout(() => router.push('/dashboard/trades'), 2000);
          } else if (status.status === 'failed' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setImportStatus({
              status: 'error',
              message: status.error || 'Import failed. Please try again.',
            });
            toast.error('Import failed');
          } else {
            setImportStatus({
              status: 'processing',
              message: `Processing... ${status.progress || 0}%`,
            });
          }
        } catch (error) {
          clearInterval(pollInterval);
          setImportStatus({
            status: 'error',
            message: 'Failed to check import status',
          });
        }
      }, 2000);

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({
        status: 'error',
        message: 'Failed to import trades. Please try again.',
      });
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    // CSV import would be implemented here
    toast.info('CSV import coming soon!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Trades</h1>
        <p className="text-muted-foreground">
          Import your trading history from wallets or CSV files
        </p>
      </div>

      <div className="grid gap-6">
        {/* Import Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Import Method</CardTitle>
            <CardDescription>
              Select how you want to import your trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={importMethod === 'wallet' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setImportMethod('wallet')}
              >
                <Wallet className="h-8 w-8 mb-2" />
                <span>Wallet Address</span>
              </Button>
              <Button
                variant={importMethod === 'csv' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setImportMethod('csv')}
              >
                <FileUp className="h-8 w-8 mb-2" />
                <span>CSV File</span>
              </Button>
              <Button
                variant={importMethod === 'api' ? 'default' : 'outline'}
                className="h-24 flex-col"
                onClick={() => setImportMethod('api')}
                disabled
              >
                <Upload className="h-8 w-8 mb-2" />
                <span>API (Coming Soon)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Configuration */}
        {importMethod === 'wallet' && (
          <Card>
            <CardHeader>
              <CardTitle>Import from Wallet</CardTitle>
              <CardDescription>
                Enter your wallet address to import trading history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chain">Blockchain</Label>
                <Select value={chain} onValueChange={(value: any) => setChain(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLANA">Solana</SelectItem>
                    <SelectItem value="BASE">Base</SelectItem>
                    <SelectItem value="BSC">BSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  placeholder={chain === 'SOLANA' ? 'Enter Solana address...' : 'Enter wallet address...'}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  disabled={isImporting}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We'll import all DEX trades from this wallet using the OKX API.
                  This may take a few minutes depending on your trading history.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleWalletImport} 
                disabled={isImporting || !walletAddress}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {importMethod === 'csv' && (
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with your trading history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv">CSV File</Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  disabled={isImporting}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV should include columns: Date, Type (BUY/SELL), Token In, Token Out, 
                  Amount In, Amount Out, Price, DEX, Fees, Transaction Hash
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleCsvImport} 
                disabled={isImporting || !csvFile}
                className="w-full"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload & Import
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Import Status */}
        {importStatus.status !== 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>Import Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                {importStatus.status === 'processing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
                {importStatus.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {importStatus.status === 'error' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{importStatus.message}</p>
                  {importStatus.importedCount !== undefined && (
                    <div className="flex gap-4 mt-2">
                      <Badge variant="default">
                        {importStatus.importedCount} imported
                      </Badge>
                      {importStatus.failedCount !== undefined && importStatus.failedCount > 0 && (
                        <Badge variant="destructive">
                          {importStatus.failedCount} failed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}