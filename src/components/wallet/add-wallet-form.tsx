'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { isValidSolanaAddress } from '@/lib/wallet-validation';

const addWalletSchema = z.object({
  address: z.string().min(1, "Address is required").refine(isValidSolanaAddress, {
    message: "Invalid Solana wallet address"
  }),
  label: z.string().optional()
});

type AddWalletData = z.infer<typeof addWalletSchema>;

export function AddWalletForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AddWalletData>({
    resolver: zodResolver(addWalletSchema)
  });

  const addressValue = watch('address');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValue('address', text.trim());
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  const onSubmit = async (data: AddWalletData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add wallet');
      }

      toast.success('Wallet added successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Solana Wallet</CardTitle>
        <CardDescription>
          Add a Solana wallet address to import your trading history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="address">Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                {...register('address')}
                placeholder="Enter or paste Solana address..."
                className={errors.address ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
              >
                Paste
              </Button>
            </div>
            {errors.address && (
              <p className="text-sm text-destructive mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              {...register('label')}
              placeholder="e.g., Main Trading Wallet"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Adding Wallet...' : 'Add Wallet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}