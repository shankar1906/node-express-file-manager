export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER: 'User',
  VIEWER: 'Viewer',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const MODULES = {
  DASHBOARD: 'dashboard',
  FILES: 'files',
  UPLOAD: 'upload',
  DELETE: 'delete',
  DOWNLOAD: 'download',
  USERS: 'users',
  ROLES: 'roles',
  SETTINGS: 'settings',
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type ActionName = (typeof ACTIONS)[keyof typeof ACTIONS];

export const PERMISSION_MATRIX: Record<
  RoleName,
  Partial<Record<ModuleName, ActionName[]>>
> = {
  [ROLES.SUPER_ADMIN]: {
    dashboard: ['view'],
    files: ['view', 'create', 'update', 'delete'],
    upload: ['create'],
    delete: ['delete'],
    download: ['view'],
    users: ['view', 'create', 'update', 'delete'],
    roles: ['view', 'create', 'update', 'delete'],
    settings: ['view', 'update'],
  },
  [ROLES.ADMIN]: {
    dashboard: ['view'],
    files: ['view', 'create', 'update', 'delete'],
    upload: ['create'],
    delete: ['delete'],
    download: ['view'],
    users: ['view', 'create', 'update', 'delete'],
    roles: ['view'],
    settings: ['view', 'update'],
  },
  [ROLES.MANAGER]: {
    dashboard: ['view'],
    files: ['view', 'create', 'update'],
    upload: ['create'],
    download: ['view'],
    settings: ['view'],
  },
  [ROLES.USER]: {
    dashboard: ['view'],
    files: ['view', 'create'],
    upload: ['create'],
    download: ['view'],
    settings: ['view'],
  },
  [ROLES.VIEWER]: {
    dashboard: ['view'],
    files: ['view'],
    download: ['view'],
    settings: ['view'],
  },
};
