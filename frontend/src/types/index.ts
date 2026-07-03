export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  createdAt?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role: { id: string; name: string };
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export interface FileRecord {
  id: string;
  fileName: string;
  originalName: string;
  projectId: string | null;
  projectName: string | null;
  projectTotalFiles?: number;
  extension: string;
  mimeType: string;
  size: number;
  status: string;
  description?: string | null;
  uploadedAt: string;
  uploadedBy?: { id: string; name: string; email: string };
  checksum?: string | null;
}

export interface PaginatedFiles {
  data: FileRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectRecord {
  id: string;
  projectId: string;
  projectName: string;
  description?: string | null;
  status?: string;
  totalFiles: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProjects {
  data: ProjectRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalFiles: number;
  totalUsers: number;
  todayUploads: number;
  storageUsed: number;
  recentFiles: FileRecord[];
  uploadTrend: { date: string; count: number }[];
}
