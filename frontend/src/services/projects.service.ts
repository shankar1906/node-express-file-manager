import { apiClient } from '@/lib/api';
import type { PaginatedProjects, ProjectRecord } from '@/types';

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const projectsService = {
  list(params: ProjectListParams) {
    return apiClient.get<PaginatedProjects>('/projects', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  getById(id: string) {
    return apiClient.get<ProjectRecord>(`/projects/${id}`);
  },

  update(id: string, data: { projectName?: string; description?: string; status?: string }) {
    return apiClient.patch<ProjectRecord>(`/projects/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/projects/${id}/delete`);
  },
};
