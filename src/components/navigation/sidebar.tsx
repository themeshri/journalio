'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Package,
  Download,
  Settings,
  Activity,
  Brain
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Wallets',
    href: '/dashboard/wallets',
    icon: Wallet,
  },
  {
    name: 'Trades',
    href: '/dashboard/trades',
    icon: Activity,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics', 
    icon: TrendingUp,
  },
  {
    name: 'Positions',
    href: '/dashboard/positions',
    icon: Package,
  },
  {
    name: 'Mistakes',
    href: '/dashboard/mistakes',
    icon: Brain,
  },
  {
    name: 'Import Trades',
    href: '/dashboard/import',
    icon: Download,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-background border-r border-border">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}