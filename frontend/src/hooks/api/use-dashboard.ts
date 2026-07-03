'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { dashboardService } from '@/services';

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardService.getStats(),
  });
}
