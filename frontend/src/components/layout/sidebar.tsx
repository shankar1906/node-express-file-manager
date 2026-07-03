'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Files,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/constants';
import { useUIStore, useAuthStore } from '@/store';
import { useLogoutMutation } from '@/hooks/api';

const iconMap = {
  LayoutDashboard,
  Upload,
  Users,
  Shield,
  Settings,
  Files,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950',
        sidebarCollapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-gray-100 px-4 dark:border-gray-800', sidebarCollapsed && 'justify-center px-2')}>
        {!sidebarCollapsed && (
          <span className="text-sm font-bold tracking-tight text-blue-600">FMS</span>
        )}
        {sidebarCollapsed && (
          <span className="text-sm font-bold text-blue-600">F</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export function SidebarToggle() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <button
      onClick={toggleSidebar}
      className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </button>
  );
}

export function useSidebarUser() {
  return useAuthStore((s) => s.user);
}
