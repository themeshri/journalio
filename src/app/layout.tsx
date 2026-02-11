import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChainJournal',
  description: 'Professional crypto trading journal and analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
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
      // Session synchronization is handled automatically by Clerk
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}