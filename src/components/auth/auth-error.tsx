'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface AuthErrorProps {
  error?: Error;
  reset?: () => void;
  message?: string;
}

export function AuthError({ error, reset, message }: AuthErrorProps) {
  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
    }
  }, [error]);

  const errorMessage = message || error?.message || 'An authentication error occurred';

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
        <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
        <p className="text-gray-600">
          {errorMessage}
        </p>
        <div className="space-y-3">
          {reset && (
            <Button onClick={reset} className="w-full">
              Try Again
            </Button>
          )}
          <a href="/sign-in" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Sign In
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}