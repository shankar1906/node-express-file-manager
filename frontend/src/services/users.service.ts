import { apiClient } from '@/lib/api';
import type { UserRecord } from '@/types';

export const usersService = {
  list() {
    return apiClient.get<UserRecord[]>('/users');
  },
};
