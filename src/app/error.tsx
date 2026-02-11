'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // In development mode, bypass auth errors
  const isAuthError = error.message?.includes('auth') || 
                      error.message?.includes('sign') ||
                      error.message?.includes('session') ||
                      error.message?.includes('Unauthorized');

  if (isAuthError && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true')) {
    // In development, refresh the page instead of showing auth error
    useEffect(() => {
      reset();
    }, [reset]);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <h2 className="text-xl font-semibold">Development Mode</h2>
          <p className="text-gray-600">Bypassing authentication...</p>
          <Button onClick={reset}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Generic error fallback for production
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4 max-w-md mx-auto p-8">
        <div className="text-red-500 mb-4">
          <svg 
            className="mx-auto h-12 w-12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-gray-600">{error.message}</p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}