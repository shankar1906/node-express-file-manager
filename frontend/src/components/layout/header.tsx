'use client';

import { Bell, Search, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SidebarToggle, useSidebarUser } from './sidebar';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useSidebarUser();

  useEffect(() => setMounted(true), []);

  const pageRouter = (path: string) => {
    router.push(path)
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-4">
        <SidebarToggle />
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Settings" onClick={() => pageRouter('/settings') }>
          <Settings className="h-4 w-4" />
        </button>
        {/* {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )} */}
        <div className="ml-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 dark:border-gray-700">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
            {user?.name ?? 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
