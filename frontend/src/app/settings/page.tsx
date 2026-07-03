'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => setMounted(true), []);

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-4 p-3">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Appearance</h3>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  disabled={!mounted}
                  onClick={() => setTheme(t)}
                  className={`rounded-lg border px-4 py-2 text-sm capitalize transition-colors disabled:opacity-50 ${
                    mounted && theme === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </DashboardLayout>
  );
}
