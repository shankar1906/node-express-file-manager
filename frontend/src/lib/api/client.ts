import { API_BASE_URL } from '@/constants';
import type { ApiResponse } from '@/types';
import { ApiError } from './errors';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  notifyLogout,
  notifyTokenRefresh,
} from './auth-config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(path, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function processRefreshQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    notifyLogout();
    throw new ApiError('Session expired', 401);
  }

  const response = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await response.json()) as ApiResponse<{
    accessToken: string;
    refreshToken: string;
  }>;

  if (!response.ok || !payload.data) {
    notifyLogout();
    throw new ApiError(payload.message ?? 'Session expired', response.status, payload.errors);
  }

  notifyTokenRefresh(payload.data.accessToken, payload.data.refreshToken);
  return payload.data.accessToken;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    if (!response.ok) {
      throw new ApiError(response.statusText || 'Request failed', response.status);
    }
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message ?? 'Request failed', response.status, payload.errors);
  }

  return payload.data as T;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const {
    params,
    body,
    headers,
    auth = true,
    retryOnUnauthorized = true,
  } = options;

  const requestHeaders = new Headers(headers);

  if (auth) {
    const token = getStoredAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  if (
    response.status === 401 &&
    auth &&
    retryOnUnauthorized &&
    !isRetry &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/refresh')
  ) {
    if (isRefreshing) {
      const token = await new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      requestHeaders.set('Authorization', `Bearer ${token}`);
      return request<T>(method, path, { ...options, headers: requestHeaders }, true);
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processRefreshQueue(null, newToken);
      requestHeaders.set('Authorization', `Bearer ${newToken}`);
      return request<T>(method, path, { ...options, headers: requestHeaders }, true);
    } catch (error) {
      processRefreshQueue(error, null);
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return parseResponse<T>(response);
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('GET', path, options);
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('POST', path, { ...options, body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('PUT', path, { ...options, body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('PATCH', path, { ...options, body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('DELETE', path, options);
  },
};

export async function downloadBlob(path: string, filename: string): Promise<void> {
  const token = getStoredAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new ApiError('Download failed', response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
