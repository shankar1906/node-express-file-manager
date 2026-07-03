import { apiClient } from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  permissions: { module: string; action: string }[];
  _count: { users: number };
}

export const rolesService = {
  list() {
    return apiClient.get<Role[]>('/roles');
  },
};
