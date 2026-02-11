# Plan 01-01: Project Setup & Authentication

**Phase:** 01-foundation  
**Plan:** 01  
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

## Objective

Establish the ChainJournal project foundation with Next.js 16, TypeScript, and Clerk authentication supporting social logins (Twitter/X, Google) and email/password. Users can securely sign up, log in, stay authenticated across sessions and devices, and log out from any page.

**Purpose:** Create secure authentication foundation that scales with SaaS requirements  
**Output:** Working authentication system with all social login providers and session management

## Tasks

### Task 1: Initialize Next.js 16 Project with Dependencies

**Files created:**
- `package.json`
- `next.config.js`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/ui/` (shadcn components)

**Action:**
Initialize Next.js 16 project with TypeScript, Tailwind CSS, and essential dependencies. Install Clerk for authentication, Shadcn UI for components, and supporting libraries.

```bash
# Create Next.js project
npx create-next-app@latest chainjournal --typescript --tailwind --eslint --app --src-dir

# Navigate to project
cd chainjournal

# Install core authentication and UI dependencies
npm install @clerk/nextjs lucide-react

# Initialize Shadcn UI
npx shadcn-ui@latest init --defaults

# Install UI components we'll need
npx shadcn-ui@latest add button card input label separator toast

# Install form handling and validation
npm install react-hook-form @hookform/resolvers zod

# Install data fetching
npm install @tanstack/react-query zustand
```

Configure Next.js for Clerk authentication in `next.config.js` and set up Tailwind configuration for Shadcn UI integration.

**Verify:**
- `npm run dev` starts development server without errors
- Navigate to `http://localhost:3000` shows default Next.js page
- TypeScript compilation works without errors
- All dependencies install successfully

**Done:** Next.js 16 project initialized with complete authentication and UI dependency stack

### Task 2: Configure Clerk Authentication with Social Providers

**Files created:**
- `.env.local`
- `src/middleware.ts`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/lib/auth.ts`

**Action:**
Set up Clerk authentication with Twitter/X, Google, and email/password providers. Create authentication middleware, sign-in/sign-up pages, and helper functions.

```typescript
// .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

```typescript
// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

```typescript
// src/lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export async function getUserDetails() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName,
    avatar: user.imageUrl
  };
}
```

Create sign-in and sign-up pages using Clerk components. Configure social providers (Twitter/X, Google) in Clerk dashboard.

**Verify:**
- Navigate to `/sign-in` shows Clerk sign-in component
- Social login buttons for Twitter/X and Google appear
- Email/password form works
- Sign-up flow redirects to `/dashboard` after completion

**Done:** Complete authentication system with social logins and session management configured

### Task 3: Create Dashboard Layout with Protected Routes

**Files created:**
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/navigation/header.tsx`
- `src/components/navigation/sidebar.tsx`
- `src/components/auth/user-profile.tsx`

**Action:**
Create protected dashboard layout with navigation header, sidebar, and user profile dropdown. Implement logout functionality accessible from any dashboard page.

```typescript
// src/app/dashboard/layout.tsx
import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/navigation/header';
import { Sidebar } from '@/components/navigation/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(); // Protect all dashboard routes
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

```typescript
// src/components/auth/user-profile.tsx
'use client';

import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user } = useUser();
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <p className="font-medium">{user?.fullName}</p>
        <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
      </div>
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      />
    </div>
  );
}
```

Implement navigation with placeholders for wallet management and trade import features to be built in later plans.

**Verify:**
- Access `/dashboard` without authentication redirects to sign-in
- Authenticated users see dashboard with header and sidebar
- User profile shows name and email
- Logout button works and redirects to home page
- Session persists across browser refresh

**Done:** Protected dashboard layout with complete authentication flow and logout functionality

### Task 4: Implement Cross-Device Session Synchronization

**Files modified:**
- `src/app/layout.tsx`
- `src/components/providers/clerk-provider.tsx`

**Action:**
Configure Clerk for multi-device session synchronization. Set up proper session tokens and implement session validation across devices.

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0F172A"
        }
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

Test session synchronization by logging in on one device/browser and verifying the session persists on another device.

**Verify:**
- Login on device/browser A
- Open application on device/browser B (same user account)
- Session automatically syncs and user is authenticated
- Logout on one device logs out all sessions
- Session state updates across devices without refresh

**Done:** Multi-device session synchronization working with Clerk's built-in session management

### Task 5: Create Authentication Error Handling and Loading States

**Files created:**
- `src/components/auth/auth-loading.tsx`
- `src/components/auth/auth-error.tsx`
- `src/app/error.tsx`
- `src/app/loading.tsx`

**Action:**
Implement proper error handling for authentication failures, network issues, and loading states during authentication flows.

```typescript
// src/components/auth/auth-loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-80">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
```

```typescript
// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          Authentication error occurred. Please try again.
        </p>
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
```

Add error boundaries around authentication components and implement retry logic for failed authentication attempts.

**Verify:**
- Network interruption during sign-in shows appropriate loading state
- Authentication errors display user-friendly error messages
- Retry functionality works for transient errors
- Loading states appear during authentication redirects

**Done:** Robust error handling and loading states for all authentication scenarios

### Task 6: Validate Authentication Requirements

**Files modified:**
- `src/app/page.tsx` (add authentication status check)

**Action:**
Create comprehensive test scenarios to validate all authentication requirements are met. Test social logins, session persistence, multi-device sync, and logout functionality.

Update homepage to show authentication status and provide sign-in/sign-up links for unauthenticated users.

```typescript
// src/app/page.tsx
import { auth } from '@clerk/nextjs/server';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function Home() {
  const { userId } = auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">ChainJournal</h1>
        <p className="text-xl text-muted-foreground">
          Professional crypto trading journal and analytics
        </p>
        
        {userId ? (
          <div className="space-y-4">
            <p className="text-green-600">✓ You are authenticated</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
```

**Verify:**
- [ ] AUTH-01: Twitter/X sign-up works
- [ ] AUTH-02: Google sign-up works
- [ ] AUTH-03: Email/password sign-up works
- [ ] AUTH-04: Session persists across browser refresh
- [ ] AUTH-05: Logout works from dashboard pages
- [ ] AUTH-06: User data syncs across multiple devices/browsers

**Done:** All Phase 1 authentication requirements validated and working

## Success Criteria

**Must be TRUE:**
1. Users can sign up and log in using Twitter/X, Google, or email/password
2. User sessions persist across browser refresh and device switching
3. Users can log out from any protected page
4. Authentication state synchronizes across multiple devices
5. Error handling provides clear feedback for authentication issues
6. All authentication flows redirect properly to dashboard after completion

**Verification Commands:**
```bash
npm run dev
# Test all sign-up/sign-in flows
# Test session persistence
# Test cross-device sync
# Test logout functionality
```

**Artifacts Created:**
- Complete Next.js 16 project with TypeScript
- Clerk authentication with social providers configured
- Protected dashboard layout with navigation
- Error handling and loading states
- Cross-device session synchronization