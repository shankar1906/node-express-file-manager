import { apiClient } from '@/lib/api';
import type { DashboardStats } from '@/types';

export const dashboardService = {
  getStats() {
    return apiClient.get<DashboardStats>('/dashboard');
  },
};
