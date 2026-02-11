import { auth } from '@clerk/nextjs/server';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">ChainJournal</h1>
        <p className="text-xl text-muted-foreground">
          Professional crypto trading journal and analytics
        </p>
        
        {userId ? (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">✓ You are authenticated</p>
            <p className="text-sm text-muted-foreground">Welcome back! Ready to track your trades?</p>
            <Link href="/dashboard">
              <Button size="lg" className="mt-4">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-blue-600">✓ Authentication system ready</p>
              <p className="text-green-600">✓ Social login providers configured</p>
              <p className="text-green-600">✓ Session management enabled</p>
            </div>
            <div className="space-x-4">
              <Link href="/sign-in">
                <Button size="lg">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="lg">Sign Up</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Create an account to start tracking your crypto trades
            </p>
          </div>
        )}
      </div>
    </main>
  );
}