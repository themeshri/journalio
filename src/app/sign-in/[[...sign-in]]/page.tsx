'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const router = useRouter();
  
  // In development, bypass authentication
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ChainJournal</h1>
          <p className="text-gray-600 mt-2">Development Mode</p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Authentication bypassed for development
          </p>
          
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}