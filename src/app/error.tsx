'use client';

import { useEffect } from 'react';
import { AuthError } from '@/components/auth/auth-error';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // Check if this is an authentication-related error
  const isAuthError = error.message?.includes('auth') || 
                      error.message?.includes('sign') ||
                      error.message?.includes('session') ||
                      error.message?.includes('Unauthorized');

  if (isAuthError) {
    return <AuthError error={error} reset={reset} />;
  }

  // Generic error fallback
  return <AuthError error={error} reset={reset} message="Something went wrong!" />;
}