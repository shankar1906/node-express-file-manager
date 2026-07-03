'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { authService, type LoginPayload } from '@/services';
import { useAuthStore } from '@/store';

export function useLoginMutation() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    meta: {
      successMessage: 'Signed in successfully',
      errorMessage: 'Login failed. Please try again.',
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push(ROUTES.DASHBOARD);
    },
  });
}

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    meta: {
      successMessage: 'Signed out successfully',
      errorMessage: 'Logout failed',
    },
    onSettled: () => {
      logout();
      window.location.href = ROUTES.LOGIN;
    },
  });
}
