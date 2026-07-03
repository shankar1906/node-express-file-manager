'use client';

import { useEffect } from 'react';
import { configureApiAuth } from '@/lib/api';
import { useAuthStore } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => useAuthStore.getState().accessToken,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      onTokenRefresh: (accessToken, refreshToken) => {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      },
      onLogout: () => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      },
    });
  }, []);

  return <>{children}</>;
}
