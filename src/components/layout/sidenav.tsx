'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard,
  TrendingUp,
  Receipt,
  BookOpen,
  PieChart,
  AlertTriangle,
  Calendar,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Circle,
  Activity,
  FileText,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  isNew?: boolean;
  count?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SideNavProps {
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const navSections: NavSection[] = [
  {
    title: 'Trading',
    items: [
      { 
        icon: LayoutDashboard, 
        label: 'Dashboard', 
        href: '/dashboard',
        badge: 'LIVE',
        badgeVariant: 'destructive'
      },
      { 
        icon: TrendingUp, 
        label: 'Positions', 
        href: '/dashboard/positions',
        count: 12
      },
      { 
        icon: Receipt, 
        label: 'Trades', 
        href: '/dashboard/trades'
      },
      { 
        icon: BookOpen, 
        label: 'Journal', 
        href: '/dashboard/journal',
        isNew: true
      },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { 
        icon: PieChart, 
        label: 'Performance', 
        href: '/dashboard/analytics'
      },
      { 
        icon: AlertTriangle, 
        label: 'Mistakes', 
        href: '/dashboard/mistakes',
        count: 3
      },
      { 
        icon: Calendar, 
        label: 'Calendar', 
        href: '/dashboard/calendar'
      },
    ]
  },
  {
    title: 'Management',
    items: [
      { 
        icon: Wallet, 
        label: 'Wallets', 
        href: '/dashboard/wallets'
      },
      { 
        icon: Settings, 
        label: 'Settings', 
        href: '/dashboard/settings'
      },
    ]
  }
];

export function SideNav({ isCollapsed = false, onCollapse, isMobile = false, onClose }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] z-fixed",
      "bg-surface border-r border-border-default",
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64",
      isMobile && "shadow-xl"
    )}>
      <div className="flex flex-col h-full">
        {/* Collapse toggle */}
        {!isMobile && (
          <div className="flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapse && onCollapse(!isCollapsed)}
              className="hover:bg-surface-hover"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Quick actions */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <Button 
              className="w-full justify-start gap-2 bg-gradient-accent hover:opacity-90"
              onClick={() => handleNavClick('/dashboard/trades/add')}
            >
              <Plus className="h-4 w-4" />
              New Trade
            </Button>
          </div>
        )}

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-3">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "w-full justify-start gap-3 relative group",
                        "hover:bg-surface-hover transition-colors",
                        isActive && "bg-surface-hover text-primary"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-accent rounded-r" />
                      )}
                      
                      {/* Icon */}
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "text-text-secondary",
                        "group-hover:text-primary transition-colors"
                      )} />
                      
                      {/* Label and badges */}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">
                            {item.label}
                          </span>
                          
                          {/* Count badge */}
                          {item.count !== undefined && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.count}
                            </Badge>
                          )}
                          
                          {/* Status badge */}
                          {item.badge && (
                            <Badge 
                              variant={item.badgeVariant || 'default'}
                              className="ml-auto"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          
                          {/* New indicator */}
                          {item.isNew && (
                            <Circle className="h-2 w-2 fill-success text-success ml-auto" />
                          )}
                        </>
                      )}
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated text-text-primary text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-tooltip shadow-lg">
                          {item.label}
                          {item.count !== undefined && ` (${item.count})`}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* Section separator */}
              {sectionIndex < navSections.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer stats */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border-default">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Today's P&L</span>
                <span className="font-mono font-semibold text-success">
                  +$1,234.56
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Active Positions</span>
                <span className="font-mono font-semibold text-text-primary">
                  12
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Win Rate</span>
                <span className="font-mono font-semibold text-text-primary">
                  67.8%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activity indicator for collapsed state */}
        {isCollapsed && (
          <div className="p-4 border-t border-border-default flex justify-center">
            <Activity className="h-5 w-5 text-success animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}