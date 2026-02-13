'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from './topbar';
import { SideNav } from './sidenav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      handleSidebarCollapse(!isSidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <TopBar 
        onMenuClick={handleMenuClick}
        isSidebarOpen={isMobileSidebarOpen}
        user={user}
      />

      {/* Mobile sidebar overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-modal-backdrop lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "transition-transform duration-300 ease-in-out",
        isMobile && (isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full")
      )}>
        <SideNav 
          isCollapsed={!isMobile && isSidebarCollapsed}
          onCollapse={handleSidebarCollapse}
          isMobile={isMobile}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300 ease-in-out",
        !isMobile && (isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")
      )}>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}