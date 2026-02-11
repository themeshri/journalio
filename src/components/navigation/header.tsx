'use client';

import { UserProfile } from '@/components/auth/user-profile';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">ChainJournal</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}