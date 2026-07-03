export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  DOCUMENTS: '/documents',
  USERS: '/users',
  ROLES: '/roles',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

export const NAV_ITEMS = [
  { label: 'DASHBOARD', href: ROUTES.DASHBOARD, icon: 'LayoutDashboard', module: 'dashboard' },
  { label: 'UPLOAD FILES', href: ROUTES.UPLOAD, icon: 'Upload', module: 'upload' },
  { label: 'ALL DOCUMENTS', href: ROUTES.DOCUMENTS, icon: 'Files', module: 'files' },
  { label: 'USERS', href: ROUTES.USERS, icon: 'Users', module: 'users' },
  { label: 'ROLES', href: ROUTES.ROLES, icon: 'Shield', module: 'roles' },
  { label: 'SETTINGS', href: ROUTES.SETTINGS, icon: 'Settings', module: 'settings' },
] as const;
