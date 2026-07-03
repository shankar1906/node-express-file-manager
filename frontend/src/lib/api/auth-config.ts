let getAccessToken: (() => string | null) | null = null;
let getRefreshToken: (() => string | null) | null = null;
let onTokenRefresh: ((access: string, refresh: string) => void) | null = null;
let onLogout: (() => void) | null = null;

export function configureApiAuth(config: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefresh: (access: string, refresh: string) => void;
  onLogout: () => void;
}) {
  getAccessToken = config.getAccessToken;
  getRefreshToken = config.getRefreshToken;
  onTokenRefresh = config.onTokenRefresh;
  onLogout = config.onLogout;
}

export function getStoredAccessToken(): string | null {
  return getAccessToken?.() ?? null;
}

export function getStoredRefreshToken(): string | null {
  return getRefreshToken?.() ?? null;
}

export function notifyTokenRefresh(access: string, refresh: string): void {
  onTokenRefresh?.(access, refresh);
}

export function notifyLogout(): void {
  onLogout?.();
}
