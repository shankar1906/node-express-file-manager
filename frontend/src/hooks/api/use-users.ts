'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { usersService } from '@/services';

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => usersService.list(),
  });
}
