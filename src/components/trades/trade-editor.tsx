'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Eye, 
  History,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeEditInput, TradeSource } from '@/types/trade';
import { toast } from 'sonner';
import { TradeJournal } from '@/components/journaling/trade-journal';

// Trade edit validation schema
const tradeEditSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['buy', 'sell', 'swap']).optional(),
  tokenIn: z.string().min(1).optional(),
  tokenOut: z.string().min(1).optional(),
  amountIn: z.string()
    .refine(val => val === '' || (!isNaN(Number(val)) && Number(val) > 0), 'Must be a positive number')
    .optional(),
  amountOut: z.string()
    .refine(val => val === '' || (!isNaN(Number(val)) && Number(val) > 0), 'Must be a positive number')
    .optional(),
  priceIn: z.string().optional(),
  priceOut: z.string().optional(),
  dex: z.string().optional(),
  fees: z.string()
    .refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), 'Must be a non-negative number')
    .optional(),
  blockTime: z.date().optional(),
  notes: z.string().optional(),
  reason: z.string().min(1, 'Please provide a reason for this edit'),
});

type TradeEditValues = z.infer<typeof tradeEditSchema>;

interface TradeData {
  id: string;
  signature: string;
  type: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceIn?: string;
  priceOut?: string;
  dex: string;
  fees: string;
  blockTime: Date;
  notes?: string;
  source: TradeSource;
  isEditable: boolean;
  originalData?: any;
  lastModified: Date;
  modifiedBy?: string;
  auditLogs?: Array<{
    id: string;
    action: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    timestamp: Date;
    userId: string;
  }>;
}

interface TradeEditorProps {
  tradeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TradeEditor({ tradeId, onSuccess, onCancel }: TradeEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);
  const [originalValues, setOriginalValues] = useState<Partial<TradeData>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [impactAnalysis, setImpactAnalysis] = useState<{
    pnlChange: number;
    positionImpact: string;
    warnings: string[];
  } | null>(null);

  const form = useForm<TradeEditValues>({
    resolver: zodResolver(tradeEditSchema),
    defaultValues: {
      id: tradeId,
      type: undefined,
      tokenIn: '',
      tokenOut: '',
      amountIn: '',
      amountOut: '',
      priceIn: '',
      priceOut: '',
      dex: '',
      fees: '',
      blockTime: undefined,
      notes: '',
      reason: '',
    },
  });

  // Fetch trade data
  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/trades/${tradeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trade data');
        }

        const trade = await response.json();
        setTradeData(trade);
        setOriginalValues({
          type: trade.type,
          tokenIn: trade.tokenIn,
          tokenOut: trade.tokenOut,
          amountIn: trade.amountIn,
          amountOut: trade.amountOut,
          priceIn: trade.priceIn,
          priceOut: trade.priceOut,
          dex: trade.dex,
          fees: trade.fees,
          blockTime: new Date(trade.blockTime),
          notes: trade.notes,
        });

        // Pre-populate form
        form.reset({
          id: trade.id,
          type: trade.type,
          tokenIn: trade.tokenIn,
          tokenOut: trade.tokenOut,
          amountIn: trade.amountIn.toString(),
          amountOut: trade.amountOut.toString(),
          priceIn: trade.priceIn?.toString() || '',
          priceOut: trade.priceOut?.toString() || '',
          dex: trade.dex,
          fees: trade.fees.toString(),
          blockTime: new Date(trade.blockTime),
          notes: trade.notes || '',
          reason: '',
        });
      } catch (error) {
        console.error('Failed to fetch trade:', error);
        toast.error('Failed to load trade data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [tradeId, form]);

  // Check for restricted fields based on trade source
  const isFieldRestricted = (fieldName: string) => {
    if (!tradeData) return false;
    
    // Imported trades have some restrictions to preserve data integrity
    if (tradeData.source === TradeSource.IMPORTED) {
      const restrictedFields = ['signature', 'blockTime', 'tokenIn', 'tokenOut'];
      return restrictedFields.includes(fieldName);
    }
    
    return false;
  };

  // Get field differences
  const getFieldDifference = (fieldName: keyof typeof originalValues) => {
    const currentValue = form.watch(fieldName as any);
    const originalValue = originalValues[fieldName];
    
    if (fieldName === 'blockTime') {
      const current = currentValue as Date;
      const original = originalValue as Date;
      return current?.getTime() !== original?.getTime();
    }
    
    return String(currentValue || '') !== String(originalValue || '');
  };

  // Calculate impact analysis
  const calculateImpact = (values: Partial<TradeEditValues>) => {
    if (!tradeData) return;

    const changes = Object.keys(values).filter(key => 
      getFieldDifference(key as keyof typeof originalValues)
    );

    if (changes.length === 0) {
      setImpactAnalysis(null);
      return;
    }

    // Simple impact analysis (in real app, this would be more sophisticated)
    const significantFields = ['amountIn', 'amountOut', 'priceIn', 'priceOut', 'fees'];
    const hasSignificantChanges = changes.some(field => significantFields.includes(field));

    const warnings: string[] = [];
    let pnlChange = 0;

    if (hasSignificantChanges) {
      warnings.push('This change will affect P&L calculations');
      warnings.push('Position tracking will be recalculated');
      
      // Estimate P&L impact (simplified)
      if (values.amountIn || values.amountOut || values.priceIn || values.priceOut) {
        const oldValue = parseFloat(originalValues.amountOut?.toString() || '0') * 
                        parseFloat(originalValues.priceOut?.toString() || '1');
        const newValue = parseFloat(values.amountOut || originalValues.amountOut?.toString() || '0') * 
                        parseFloat(values.priceOut || originalValues.priceOut?.toString() || '1');
        pnlChange = newValue - oldValue;
      }
    }

    if (changes.includes('tokenIn') || changes.includes('tokenOut')) {
      warnings.push('Changing tokens will affect position grouping');
    }

    setImpactAnalysis({
      pnlChange,
      positionImpact: hasSignificantChanges ? 'Will recalculate position metrics' : 'No position impact',
      warnings,
    });
  };

  // Watch form changes for impact analysis
  useEffect(() => {
    const subscription = form.watch((values) => {
      calculateImpact(values);
    });

    return () => subscription.unsubscribe();
  }, [form, tradeData, originalValues]);

  // Revert to original values
  const revertToOriginal = () => {
    if (!tradeData?.originalData) {
      toast.error('No original data available');
      return;
    }

    const original = tradeData.originalData;
    form.reset({
      id: tradeData.id,
      type: original.type,
      tokenIn: original.tokenIn,
      tokenOut: original.tokenOut,
      amountIn: original.amountIn.toString(),
      amountOut: original.amountOut.toString(),
      priceIn: original.priceIn?.toString() || '',
      priceOut: original.priceOut?.toString() || '',
      dex: original.dex,
      fees: original.fees.toString(),
      blockTime: new Date(original.blockTime),
      notes: original.notes || '',
      reason: 'Reverted to original imported data',
    });

    toast.success('Reverted to original data');
  };

  const onSubmit = async (values: TradeEditValues) => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update trade');
      }

      const updatedTrade = await response.json();
      toast.success('Trade updated successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/trades');
      }
    } catch (error) {
      console.error('Failed to update trade:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const hasChanges = Object.keys(originalValues).some(key => 
      getFieldDifference(key as keyof typeof originalValues)
    );

    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    setShowConfirmDialog(true);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">Loading trade data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!tradeData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-red-600">Failed to load trade data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Edit Trade
              <Badge variant={tradeData.source === TradeSource.IMPORTED ? 'secondary' : 'default'}>
                {tradeData.source === TradeSource.IMPORTED ? 'Imported' : 'Manual'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Last modified: {format(new Date(tradeData.lastModified), 'PPpp')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {tradeData.auditLogs && tradeData.auditLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuditTrail(true)}
                className="flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            )}
            
            {tradeData.originalData && (
              <Button
                variant="outline"
                size="sm"
                onClick={revertToOriginal}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Revert
              </Button>
            )}
          </div>
        </div>

        {!tradeData.isEditable && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              This trade has restricted editing to preserve data integrity.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Trade Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Trade Type
                      {isFieldRestricted('type') && <Lock className="inline w-3 h-3 ml-1" />}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isFieldRestricted('type')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="swap">Swap</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldDifference('type') && (
                      <p className="text-sm text-yellow-600">
                        Changed from: {originalValues.type}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DEX/Exchange</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    {getFieldDifference('dex') && (
                      <p className="text-sm text-yellow-600">
                        Changed from: {originalValues.dex}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fees (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="any" />
                    </FormControl>
                    {getFieldDifference('fees') && (
                      <p className="text-sm text-yellow-600">
                        Changed from: ${originalValues.fees}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Token Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Input Token</h3>
                
                <FormField
                  control={form.control}
                  name="tokenIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Token Symbol
                        {isFieldRestricted('tokenIn') && <Lock className="inline w-3 h-3 ml-1" />}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isFieldRestricted('tokenIn')} />
                      </FormControl>
                      {getFieldDifference('tokenIn') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: {originalValues.tokenIn}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
                      </FormControl>
                      {getFieldDifference('amountIn') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: {originalValues.amountIn}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
                      </FormControl>
                      {getFieldDifference('priceIn') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: ${originalValues.priceIn || '0'}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Output Token</h3>
                
                <FormField
                  control={form.control}
                  name="tokenOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Token Symbol
                        {isFieldRestricted('tokenOut') && <Lock className="inline w-3 h-3 ml-1" />}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isFieldRestricted('tokenOut')} />
                      </FormControl>
                      {getFieldDifference('tokenOut') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: {originalValues.tokenOut}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
                      </FormControl>
                      {getFieldDifference('amountOut') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: {originalValues.amountOut}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
                      </FormControl>
                      {getFieldDifference('priceOut') && (
                        <p className="text-sm text-yellow-600">
                          Changed from: ${originalValues.priceOut || '0'}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Transaction Details */}
            <FormField
              control={form.control}
              name="blockTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Transaction Date
                    {isFieldRestricted('blockTime') && <Lock className="inline w-3 h-3 ml-1" />}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          disabled={isFieldRestricted('blockTime')}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {getFieldDifference('blockTime') && (
                    <p className="text-sm text-yellow-600">
                      Changed from: {format(originalValues.blockTime!, 'PPP')}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional context or updated notes..."
                      rows={3}
                    />
                  </FormControl>
                  {getFieldDifference('notes') && (
                    <p className="text-sm text-yellow-600">
                      Changed from: {originalValues.notes || '(empty)'}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Edit Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Edit</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Please explain why you're making these changes..."
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be recorded in the audit trail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Impact Analysis */}
            {impactAnalysis && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Impact Analysis:</p>
                    {impactAnalysis.pnlChange !== 0 && (
                      <p className="text-sm">
                        P&L Change: <span className={cn(
                          "font-medium",
                          impactAnalysis.pnlChange >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {impactAnalysis.pnlChange >= 0 ? '+' : ''}${impactAnalysis.pnlChange.toFixed(2)}
                        </span>
                      </p>
                    )}
                    <p className="text-sm">{impactAnalysis.positionImpact}</p>
                    {impactAnalysis.warnings.length > 0 && (
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {impactAnalysis.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Trade Journaling Section */}
        <div className="mt-8 pt-6 border-t">
          <div className="mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5" />
              Trade Journal
            </h3>
            <p className="text-muted-foreground text-sm">
              Add your thoughts, analysis, and lessons learned from this trade
            </p>
          </div>
          
          <TradeJournal
            tradeId={tradeId}
            type="trade"
            className="mt-4"
          />
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Trade Edit</DialogTitle>
              <DialogDescription>
                You're about to modify trade data. This action will be recorded in the audit trail.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {impactAnalysis && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Changes Summary:</h4>
                  {impactAnalysis.warnings.map((warning, index) => (
                    <p key={index} className="text-sm">{warning}</p>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)}>
                  Confirm Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Audit Trail Dialog */}
        <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Trade Edit History</DialogTitle>
              <DialogDescription>
                Complete audit trail for this trade
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tradeData?.auditLogs?.map((log) => (
                <div key={log.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), 'PPpp')}
                    </span>
                  </div>
                  
                  {log.fieldName && (
                    <div className="text-sm space-y-1">
                      <p><strong>Field:</strong> {log.fieldName}</p>
                      {log.oldValue && <p><strong>From:</strong> {log.oldValue}</p>}
                      {log.newValue && <p><strong>To:</strong> {log.newValue}</p>}
                    </div>
                  )}
                  
                  {log.reason && (
                    <p className="text-sm mt-2"><strong>Reason:</strong> {log.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default TradeEditor;