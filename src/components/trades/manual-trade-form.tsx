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
import { CalendarIcon, Calculator, Save, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeFormData } from '@/types/trade';
import { toast } from 'sonner';

// Comprehensive trade form validation schema
const tradeFormSchema = z.object({
  type: z.enum(['buy', 'sell', 'swap'], {
    required_error: 'Please select a trade type',
  }),
  tokenIn: z.string().min(1, 'Input token is required'),
  tokenOut: z.string().min(1, 'Output token is required'),
  amountIn: z.string()
    .min(1, 'Input amount is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  amountOut: z.string()
    .min(1, 'Output amount is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Must be a positive number'),
  priceIn: z.string().optional(),
  priceOut: z.string().optional(),
  dex: z.string().min(1, 'DEX/Exchange is required'),
  fees: z.string()
    .min(1, 'Fees are required')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a non-negative number'),
  blockTime: z.date({
    required_error: 'Transaction date is required',
  }),
  signature: z.string().optional(),
  notes: z.string().optional(),
  walletId: z.string().min(1, 'Wallet selection is required'),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface ManualTradeFormProps {
  walletId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  draftKey?: string; // For form persistence
}

export function ManualTradeForm({ 
  walletId: defaultWalletId, 
  onSuccess, 
  onCancel,
  draftKey = 'manual-trade-draft'
}: ManualTradeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallets, setWallets] = useState<Array<{ id: string; address: string; label?: string }>>([]);
  const [calculatedPnL, setCalculatedPnL] = useState<number | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      type: 'buy',
      tokenIn: '',
      tokenOut: '',
      amountIn: '',
      amountOut: '',
      priceIn: '',
      priceOut: '',
      dex: '',
      fees: '0',
      blockTime: new Date(),
      signature: '',
      notes: '',
      walletId: defaultWalletId || '',
    },
  });

  // Popular DEX options for quick selection
  const popularDEXes = [
    'Jupiter',
    'Raydium',
    'Orca',
    'Serum',
    'Meteora',
    'Drift',
    'Mango',
    'Binance',
    'Coinbase',
    'Kraken',
    'Uniswap',
    'Other'
  ];

  // Common Solana tokens for quick selection
  const commonTokens = [
    'SOL',
    'USDC',
    'USDT',
    'JUP',
    'RAY',
    'ORCA',
    'MNGO',
    'JTO',
    'WIF',
    'BONK',
    'FIDA',
    'SRM'
  ];

  // Load wallets on mount
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await fetch('/api/wallets');
        if (response.ok) {
          const walletsData = await response.json();
          setWallets(walletsData);
          
          // Set default wallet if only one exists
          if (walletsData.length === 1 && !defaultWalletId) {
            form.setValue('walletId', walletsData[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      }
    };

    fetchWallets();
  }, [defaultWalletId, form]);

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Object.keys(draft).forEach(key => {
          if (key === 'blockTime') {
            form.setValue(key, new Date(draft[key]));
          } else {
            form.setValue(key as keyof TradeFormValues, draft[key]);
          }
        });
        setIsDraftSaved(true);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [draftKey, form]);

  // Save draft to localStorage
  const saveDraft = () => {
    const currentValues = form.getValues();
    localStorage.setItem(draftKey, JSON.stringify(currentValues));
    setIsDraftSaved(true);
    toast.success('Draft saved');
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setIsDraftSaved(false);
    toast.success('Draft cleared');
  };

  // Calculate P&L based on inputs (simple estimation)
  const calculatePnL = (values: Partial<TradeFormValues>) => {
    const { type, amountIn, amountOut, priceIn, priceOut, fees } = values;
    
    if (!amountIn || !amountOut || !fees) return null;

    const amountInNum = parseFloat(amountIn);
    const amountOutNum = parseFloat(amountOut);
    const feesNum = parseFloat(fees);
    
    let pnl = 0;
    
    if (type === 'buy') {
      // For buy: PnL = (current value - cost - fees)
      const cost = priceIn ? amountInNum * parseFloat(priceIn) : amountInNum;
      const currentValue = priceOut ? amountOutNum * parseFloat(priceOut) : amountOutNum;
      pnl = currentValue - cost - feesNum;
    } else if (type === 'sell') {
      // For sell: PnL = (revenue - cost - fees)
      const revenue = priceOut ? amountOutNum * parseFloat(priceOut) : amountOutNum;
      const cost = priceIn ? amountInNum * parseFloat(priceIn) : amountInNum;
      pnl = revenue - cost - feesNum;
    } else if (type === 'swap') {
      // For swap: Simple difference calculation
      const inValue = priceIn ? amountInNum * parseFloat(priceIn) : amountInNum;
      const outValue = priceOut ? amountOutNum * parseFloat(priceOut) : amountOutNum;
      pnl = outValue - inValue - feesNum;
    }
    
    return pnl;
  };

  // Watch form values for auto-calculation
  useEffect(() => {
    const subscription = form.watch((values) => {
      const pnl = calculatePnL(values);
      setCalculatedPnL(pnl);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: TradeFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/trades/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create trade');
      }

      const trade = await response.json();
      
      // Clear draft on successful submission
      localStorage.removeItem(draftKey);
      setIsDraftSaved(false);
      
      toast.success('Trade created successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/trades');
      }
    } catch (error) {
      console.error('Failed to create trade:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Add Manual Trade
        </CardTitle>
        {isDraftSaved && (
          <p className="text-sm text-muted-foreground">
            Draft saved - your progress is preserved
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Trade Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.label || wallet.address.slice(0, 8) + '...'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select DEX" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularDEXes.map((dex) => (
                          <SelectItem key={dex} value={dex}>
                            {dex}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Or type custom DEX name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Token Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Input Token</h3>
                
                <FormField
                  control={form.control}
                  name="tokenIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., SOL, USDC" />
                      </FormControl>
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
                        <Input {...field} type="number" step="any" placeholder="0.00" />
                      </FormControl>
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
                        <Input {...field} type="number" step="any" placeholder="0.00 (optional)" />
                      </FormControl>
                      <FormDescription>
                        Price per token in USD
                      </FormDescription>
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
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., USDC, SOL" />
                      </FormControl>
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
                        <Input {...field} type="number" step="any" placeholder="0.00" />
                      </FormControl>
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
                        <Input {...field} type="number" step="any" placeholder="0.00 (optional)" />
                      </FormControl>
                      <FormDescription>
                        Price per token in USD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fees (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="any" placeholder="0.00" />
                    </FormControl>
                    <FormDescription>
                      Gas + trading fees
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blockTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Signature</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional link to blockchain" />
                    </FormControl>
                    <FormDescription>
                      Transaction hash/signature
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder="Additional context, strategy notes, or trade rationale..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant information about this trade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* P&L Calculation Display */}
            {calculatedPnL !== null && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Estimated P&L</h4>
                <p className={cn(
                  "text-lg font-medium",
                  calculatedPnL >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {calculatedPnL >= 0 ? '+' : ''}${calculatedPnL.toFixed(2)} USD
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This is an estimate based on your inputs
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between">
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Save Draft
                </Button>
                
                {isDraftSaved && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearDraft}
                  >
                    Clear Draft
                  </Button>
                )}
              </div>

              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Creating...' : 'Create Trade'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ManualTradeForm;