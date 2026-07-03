export const queryKeys = {
  dashboard: ['dashboard'] as const,
  projects: {
    all: ['projects'] as const,
    list: (params: { page: number; limit: number; search?: string }) =>
      ['projects', 'list', params] as const,
  },
  files: {
    all: ['files'] as const,
    list: (params: { page: number; limit: number; search?: string; projectRecordId?: string }) =>
      ['files', 'list', params] as const,
  },
  users: ['users'] as const,
  roles: ['roles'] as const,
} as const;
