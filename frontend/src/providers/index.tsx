'use client';

import { AuthProvider } from './auth-provider';
import { ConfirmDialogProvider } from './confirm-dialog-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ConfirmDialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConfirmDialogProvider>
        <Toaster richColors closeButton position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
