'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Edit, 
  Copy, 
  Download, 
  Archive, 
  ArchiveRestore,
  MoveHorizontal,
  Tag,
  Select as SelectIcon,
  X,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Trade {
  id: string;
  signature: string;
  type: 'buy' | 'sell' | 'swap';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceIn?: number;
  priceOut?: number;
  dex: string;
  fees: number;
  blockTime: Date;
  notes?: string;
  source: 'IMPORTED' | 'MANUAL';
  isArchived?: boolean;
  walletId: string;
}

interface TradeActionsProps {
  selectedTrades: string[];
  trades: Trade[];
  onSelectionChange: (tradeIds: string[]) => void;
  onTradeUpdate: () => void;
  className?: string;
}

interface BulkEditForm {
  dex?: string;
  notes?: string;
  tags?: string[];
  targetWalletId?: string;
}

interface ImpactAnalysis {
  affectedTrades: number;
  totalValue: number;
  pnlImpact: number;
  positionsAffected: string[];
  warnings: string[];
}

export function TradeActions({ 
  selectedTrades, 
  trades, 
  onSelectionChange, 
  onTradeUpdate,
  className 
}: TradeActionsProps) {
  const router = useRouter();
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditForm>({});
  const [wallets, setWallets] = useState<Array<{ id: string; address: string; label?: string }>>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);

  const selectedTradeData = trades.filter(trade => selectedTrades.includes(trade.id));
  const hasSelection = selectedTrades.length > 0;
  const allSelected = selectedTrades.length === trades.length && trades.length > 0;
  const someSelected = selectedTrades.length > 0 && selectedTrades.length < trades.length;

  // Load wallets for move operation
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await fetch('/api/wallets');
        if (response.ok) {
          const walletsData = await response.json();
          setWallets(walletsData);
        }
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      }
    };

    fetchWallets();
  }, []);

  // Calculate impact analysis when selection changes
  useEffect(() => {
    if (selectedTrades.length === 0) {
      setImpactAnalysis(null);
      return;
    }

    const analysis = calculateImpact(selectedTradeData);
    setImpactAnalysis(analysis);
  }, [selectedTrades, selectedTradeData]);

  const calculateImpact = useCallback((trades: Trade[]): ImpactAnalysis => {
    const totalValue = trades.reduce((sum, trade) => {
      const value = trade.amountOut * (trade.priceOut || 1);
      return sum + value;
    }, 0);

    const pnlImpact = trades.reduce((sum, trade) => {
      if (trade.type === 'buy') {
        return sum - (trade.amountIn * (trade.priceIn || 1)) - trade.fees;
      } else if (trade.type === 'sell') {
        return sum + (trade.amountOut * (trade.priceOut || 1)) - trade.fees;
      }
      return sum;
    }, 0);

    const positionsAffected = [
      ...new Set(trades.map(trade => `${trade.tokenIn}-${trade.tokenOut}`))
    ];

    const warnings: string[] = [];
    
    if (trades.some(trade => trade.source === 'IMPORTED')) {
      warnings.push('Some selected trades are imported and may have editing restrictions');
    }
    
    if (positionsAffected.length > 1) {
      warnings.push('Multiple token positions will be affected');
    }
    
    if (totalValue > 10000) {
      warnings.push('High value trades selected - please verify before proceeding');
    }

    return {
      affectedTrades: trades.length,
      totalValue,
      pnlImpact,
      positionsAffected,
      warnings
    };
  }, []);

  // Select all trades
  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trades.map(trade => trade.id));
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasSelection) return;

      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }

      // Delete key: Delete selected
      if (e.key === 'Delete') {
        e.preventDefault();
        setShowBulkDelete(true);
      }

      // Ctrl/Cmd + E: Edit selected
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedTrades.length === 1) {
          router.push(`/dashboard/trades/edit/${selectedTrades[0]}`);
        } else {
          setShowBulkEdit(true);
        }
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        handleClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasSelection, selectedTrades, router]);

  // Bulk delete
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/trades/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeIds: selectedTrades }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete trades');
      }

      toast.success(`${selectedTrades.length} trades deleted`);
      onSelectionChange([]);
      onTradeUpdate();
    } catch (error) {
      toast.error('Failed to delete trades');
    } finally {
      setIsProcessing(false);
      setShowBulkDelete(false);
    }
  };

  // Bulk edit
  const handleBulkEdit = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/trades/bulk-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeIds: selectedTrades,
          updates: bulkEditForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update trades');
      }

      toast.success(`${selectedTrades.length} trades updated`);
      onSelectionChange([]);
      onTradeUpdate();
    } catch (error) {
      toast.error('Failed to update trades');
    } finally {
      setIsProcessing(false);
      setShowBulkEdit(false);
      setBulkEditForm({});
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = selectedTradeData.map(trade => ({
      'Trade ID': trade.id,
      'Signature': trade.signature,
      'Type': trade.type,
      'Token In': trade.tokenIn,
      'Token Out': trade.tokenOut,
      'Amount In': trade.amountIn,
      'Amount Out': trade.amountOut,
      'Price In': trade.priceIn || '',
      'Price Out': trade.priceOut || '',
      'DEX': trade.dex,
      'Fees': trade.fees,
      'Date': trade.blockTime.toISOString(),
      'Notes': trade.notes || '',
      'Source': trade.source,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  // Duplicate trade
  const handleDuplicate = () => {
    if (selectedTrades.length === 1) {
      router.push(`/dashboard/trades/add?duplicate=${selectedTrades[0]}`);
    } else {
      setShowDuplicateDialog(true);
    }
  };

  // Archive/unarchive trades
  const handleArchiveToggle = async (archive: boolean) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/trades/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeIds: selectedTrades,
          archive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} trades`);
      }

      toast.success(`${selectedTrades.length} trades ${archive ? 'archived' : 'unarchived'}`);
      onSelectionChange([]);
      onTradeUpdate();
    } catch (error) {
      toast.error(`Failed to ${archive ? 'archive' : 'unarchive'} trades`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Move trades to different wallet
  const handleMoveToWallet = async () => {
    if (!bulkEditForm.targetWalletId) {
      toast.error('Please select a target wallet');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/trades/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeIds: selectedTrades,
          targetWalletId: bulkEditForm.targetWalletId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move trades');
      }

      toast.success(`${selectedTrades.length} trades moved to new wallet`);
      onSelectionChange([]);
      onTradeUpdate();
    } catch (error) {
      toast.error('Failed to move trades');
    } finally {
      setIsProcessing(false);
      setShowMoveDialog(false);
      setBulkEditForm({});
    }
  };

  if (!hasSelection) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <SelectIcon className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-1">No trades selected</p>
          <p className="text-sm text-muted-foreground">
            Select trades to perform bulk actions
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="mt-3"
          >
            Select All ({trades.length})
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
              <div>
                <p className="font-medium">
                  {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''} selected
                </p>
                {impactAnalysis && (
                  <p className="text-sm text-muted-foreground">
                    Total value: ${impactAnalysis.totalValue.toLocaleString()} • 
                    {impactAnalysis.positionsAffected.length} position{impactAnalysis.positionsAffected.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedTrades.length === 1 
                ? router.push(`/dashboard/trades/edit/${selectedTrades[0]}`)
                : setShowBulkEdit(true)
              }
              className="flex items-center gap-2"
            >
              <Edit className="w-3 h-3" />
              {selectedTrades.length === 1 ? 'Edit' : 'Bulk Edit'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDuplicate}
              className="flex items-center gap-2"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMoveDialog(true)}
              className="flex items-center gap-2"
            >
              <MoveHorizontal className="w-3 h-3" />
              Move
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleArchiveToggle(true)}
              className="flex items-center gap-2"
            >
              <Archive className="w-3 h-3" />
              Archive
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowBulkDelete(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>

          {/* Impact Analysis */}
          {impactAnalysis && impactAnalysis.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {impactAnalysis.warnings.map((warning, index) => (
                    <p key={index} className="text-sm">{warning}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* P&L Impact */}
          {impactAnalysis && Math.abs(impactAnalysis.pnlImpact) > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              {impactAnalysis.pnlImpact >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                Net P&L Impact: 
                <span className={cn(
                  "ml-1",
                  impactAnalysis.pnlImpact >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {impactAnalysis.pnlImpact >= 0 ? '+' : ''}${impactAnalysis.pnlImpact.toFixed(2)}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Bulk Edit Dialog */}
        <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Trades</DialogTitle>
              <DialogDescription>
                Update common fields for {selectedTrades.length} selected trades
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>DEX/Exchange</Label>
                <Input
                  value={bulkEditForm.dex || ''}
                  onChange={(e) => setBulkEditForm(prev => ({ ...prev, dex: e.target.value }))}
                  placeholder="Leave blank to keep unchanged"
                />
              </div>

              <div>
                <Label>Notes (will append to existing notes)</Label>
                <Textarea
                  value={bulkEditForm.notes || ''}
                  onChange={(e) => setBulkEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes to add..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkEdit} disabled={isProcessing}>
                  {isProcessing ? 'Updating...' : 'Update Trades'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Trades</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {impactAnalysis && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Impact:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Total value: ${impactAnalysis.totalValue.toLocaleString()}</li>
                    <li>• Positions affected: {impactAnalysis.positionsAffected.length}</li>
                    <li>• Analytics and reports will be recalculated</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDelete(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete} 
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Delete Trades'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Move Dialog */}
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Trades to Wallet</DialogTitle>
              <DialogDescription>
                Move {selectedTrades.length} selected trades to a different wallet
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Target Wallet</Label>
                <Select
                  value={bulkEditForm.targetWalletId || ''}
                  onValueChange={(value) => setBulkEditForm(prev => ({ ...prev, targetWalletId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.label || wallet.address.slice(0, 8) + '...'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMoveToWallet} disabled={isProcessing}>
                  {isProcessing ? 'Moving...' : 'Move Trades'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default TradeActions;