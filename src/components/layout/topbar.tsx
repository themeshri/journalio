'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Bell, 
  ChevronDown,
  Menu,
  X,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Wallet,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function TopBar({ onMenuClick, isSidebarOpen, user }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications] = useState(3); // Mock notification count

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-trade':
        router.push('/dashboard/trades/add');
        break;
      case 'sync':
        // Trigger wallet sync
        console.log('Syncing wallets...');
        break;
      case 'notifications':
        // Open notifications panel
        console.log('Opening notifications...');
        break;
      default:
        break;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-sticky bg-surface/80 backdrop-blur-xl border-b border-border-default">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">
              ChainJournal
            </span>
          </div>
        </div>

        {/* Center section - Global search */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <div className={cn(
              "relative flex items-center transition-all duration-200",
              isSearchFocused && "scale-[1.02]"
            )}>
              {/* Search icon */}
              <Search className="absolute left-3 h-4 w-4 text-text-muted" />
              
              {/* Command key hint */}
              <div className="absolute right-3 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-surface-muted text-text-muted rounded border border-border-default">
                  <Command className="h-3 w-3 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-surface-muted text-text-muted rounded border border-border-default">
                  K
                </kbd>
              </div>
              
              <input
                type="text"
                placeholder="Search trades, tokens, or wallets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  "w-full h-10 pl-10 pr-20 bg-surface-hover border border-border-default",
                  "rounded-lg text-sm text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
                  "transition-all duration-200"
                )}
              />
            </div>
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Add trade */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction('add-trade')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Add Trade</span>
            </Button>

            {/* Sync */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuickAction('sync')}
              className="relative"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuickAction('notifications')}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-2 px-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-text-primary">
                    {user?.name || 'Trader'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {user?.email || 'trader@example.com'}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-text-muted hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/dashboard/wallets')}>
                <Wallet className="mr-2 h-4 w-4" />
                Wallets
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => {
                  // Handle logout
                  console.log('Logging out...');
                }}
                className="text-danger"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}