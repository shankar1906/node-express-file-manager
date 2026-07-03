'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from '@/lib/toast';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            toast.fromError(error, query.meta?.errorMessage ?? 'Failed to load data');
          },
        }),
        mutationCache: new MutationCache({
          onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation.meta?.silent || mutation.meta?.silentSuccess) return;
            if (mutation.meta?.successMessage) {
              toast.success(mutation.meta.successMessage);
            }
          },
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return;
            toast.fromError(error, mutation.meta?.errorMessage ?? 'Request failed');
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
