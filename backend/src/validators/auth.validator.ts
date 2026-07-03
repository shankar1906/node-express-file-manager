import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Role is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  roleId: z.string().optional(),
});

export const fileListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  projectRecordId: z.string().uuid().optional(),
  sortBy: z.enum(['fileName', 'uploadedAt', 'size', 'status', 'projectName', 'projectId']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['projectId', 'projectName', 'totalFiles', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const renameFileSchema = z.object({
  originalName: z.string().trim().min(1, 'File name is required'),
});

export const updateProjectSchema = z.object({
  projectName: z.string().trim().min(1, 'Project name is required').optional(),
  description: z.string().trim().optional(),
  status: z.string().trim().min(1).optional(),
});

export const bulkDeleteFilesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one file'),
});
