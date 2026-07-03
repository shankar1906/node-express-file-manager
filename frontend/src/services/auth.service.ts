import { apiClient } from '@/lib/api';
import type { AuthResponse } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export const authService = {
  login(payload: LoginPayload) {
    return apiClient.post<AuthResponse>('/auth/login', payload, {
      auth: false,
      retryOnUnauthorized: false,
    });
  },

  logout() {
    return apiClient.post<void>('/auth/logout');
  },
};
