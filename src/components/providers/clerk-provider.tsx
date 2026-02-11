'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0F172A",
          colorText: "#1F2937",
          colorTextSecondary: "#6B7280",
        },
        elements: {
          formButtonPrimary: 
            "bg-primary text-primary-foreground hover:bg-primary/90",
          socialButtonsBlockButton: 
            "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700",
          formFieldInput: 
            "border-gray-300 focus:border-primary focus:ring-primary",
          footerActionLink: "text-primary hover:text-primary/90"
        }
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      // Enable session synchronization across devices
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      {children}
    </BaseClerkProvider>
  );
}