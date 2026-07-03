'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { rolesService } from '@/services';

export function useRolesQuery() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => rolesService.list(),
  });
}
