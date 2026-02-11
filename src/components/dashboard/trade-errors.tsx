'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, XCircle, Info } from 'lucide-react';

interface TradeError {
  id: string;
  signature: string;
  blockTime: Date;
  dex: string;
  error: string;
  fees: string;
}

interface TradeErrorsProps {
  errors: TradeError[];
}

export function TradeErrors({ errors }: TradeErrorsProps) {
  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Transaction Errors
          </CardTitle>
          <CardDescription>
            Failed or reverted transactions from your wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No failed transactions found</p>
            <p className="text-sm">All your trades executed successfully</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categorizeError = (error: string): { type: string; color: string; icon: JSX.Element } => {
    if (error.includes('InsufficientFundsForFee')) {
      return {
        type: 'Insufficient Funds',
        color: 'text-orange-600',
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }
    if (error.includes('AccountNotFound')) {
      return {
        type: 'Account Error',
        color: 'text-red-600',
        icon: <XCircle className="h-4 w-4" />
      };
    }
    if (error.includes('InvalidAccountData')) {
      return {
        type: 'Data Error',
        color: 'text-red-600',
        icon: <XCircle className="h-4 w-4" />
      };
    }
    if (error.includes('Instruction') && error.includes('failed')) {
      return {
        type: 'Program Error',
        color: 'text-purple-600',
        icon: <XCircle className="h-4 w-4" />
      };
    }
    return {
      type: 'Unknown Error',
      color: 'text-gray-600',
      icon: <AlertTriangle className="h-4 w-4" />
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Transaction Errors ({errors.length})
        </CardTitle>
        <CardDescription>
          Failed or reverted transactions from your wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((error) => {
            const category = categorizeError(error.error);
            
            return (
              <Alert key={error.id} variant="destructive">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <div>
                      <AlertTitle className="text-sm font-medium">
                        {category.type}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        <div className="space-y-1">
                          <p className="text-sm">{error.error}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>DEX: {error.dex}</span>
                            <span>Fees: {parseFloat(error.fees).toFixed(6)} SOL</span>
                            <span>{error.blockTime.toLocaleString()}</span>
                          </div>
                          <p className="font-mono text-xs break-all">
                            {error.signature}
                          </p>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>

        {errors.length > 5 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Showing {Math.min(5, errors.length)} of {errors.length} failed transactions.
              Consider reviewing your trading strategy if you see many failures.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Summary component showing error statistics
 */
export function TradeErrorSummary({ errors }: TradeErrorsProps) {
  const errorTypes = errors.reduce((acc, error) => {
    const category = error.error.includes('InsufficientFundsForFee') ? 'Insufficient Funds' :
                    error.error.includes('AccountNotFound') ? 'Account Error' :
                    error.error.includes('InvalidAccountData') ? 'Data Error' :
                    error.error.includes('Instruction') ? 'Program Error' : 'Other';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFees = errors.reduce((sum, error) => sum + parseFloat(error.fees), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Summary</CardTitle>
        <CardDescription>
          Breakdown of failed transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-red-600">{errors.length}</p>
            <p className="text-sm text-muted-foreground">Failed Trades</p>
          </div>
          
          <div>
            <p className="text-2xl font-bold">{totalFees.toFixed(4)}</p>
            <p className="text-sm text-muted-foreground">SOL in Fees</p>
          </div>

          <div>
            <p className="text-2xl font-bold">
              {Object.keys(errorTypes).length}
            </p>
            <p className="text-sm text-muted-foreground">Error Types</p>
          </div>

          <div>
            <p className="text-2xl font-bold">
              {Math.max(...Object.values(errorTypes))}
            </p>
            <p className="text-sm text-muted-foreground">Most Common</p>
          </div>
        </div>

        {Object.entries(errorTypes).length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Error Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(errorTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}