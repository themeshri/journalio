"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export function OKXSetup() {
  const [credentials, setCredentials] = useState({
    apiKey: '',
    secretKey: '',
    passphrase: ''
  });
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    passphrase: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const res = await fetch('/api/okx/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess(true);
      setCredentials({ apiKey: '', secretKey: '', passphrase: '' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OKX API Configuration</CardTitle>
        <CardDescription>
          Connect your OKX Web3 API to automatically import Solana transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              OKX API configured successfully. You can now sync your transactions.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={credentials.apiKey}
              onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Your OKX API Key"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecrets.secretKey ? "text" : "password"}
                value={credentials.secretKey}
                onChange={(e) => setCredentials(prev => ({ ...prev, secretKey: e.target.value }))}
                placeholder="Your OKX Secret Key"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, secretKey: !prev.secretKey }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showSecrets.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase</Label>
            <div className="relative">
              <Input
                id="passphrase"
                type={showSecrets.passphrase ? "text" : "password"}
                value={credentials.passphrase}
                onChange={(e) => setCredentials(prev => ({ ...prev, passphrase: e.target.value }))}
                placeholder="Your OKX Passphrase"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, passphrase: !prev.passphrase }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showSecrets.passphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Configuring...' : 'Save Configuration'}
          </Button>
        </form>

        <div className="border-t pt-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <span>🔒</span>
              <span>Your credentials are encrypted and stored securely</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>📌</span>
              <span>
                Get your API keys from the{' '}
                <a 
                  href="https://www.okx.com/web3/build/docs/waas/introduction-to-developer-portal-interface" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                >
                  OKX Web3 Developer Portal
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span>⚡</span>
              <span>Syncs up to 100 transactions per request with automatic pagination</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}