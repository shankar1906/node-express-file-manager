'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { projectsService, type ProjectListParams } from '@/services/projects.service';

export function useProjectsQuery(params: ProjectListParams) {
  return useQuery({
    queryKey: queryKeys.projects.list({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    }),
    queryFn: () => projectsService.list(params),
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      projectName,
      description,
      status,
    }: {
      id: string;
      projectName?: string;
      description?: string;
      status?: string;
    }) => projectsService.update(id, { projectName, description, status }),
    meta: {
      successMessage: 'Project updated successfully',
      errorMessage: 'Failed to update project',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    meta: {
      successMessage: 'Project deleted. Documents were kept.',
      errorMessage: 'Failed to delete project',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}
