'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/constants';
import { PageLoader } from '@/components/ui/page-loader';
import { useStoreHydration } from '@/hooks/use-store-hydration';

export function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();
  const hydrated = useStoreHydration();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken && !!s.user);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
