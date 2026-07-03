'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { filesService, type FileListParams, type UploadFilePayload } from '@/services';

export function useFilesQuery(params: FileListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.files.list({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      projectRecordId: params.projectRecordId,
    }),
    queryFn: () => filesService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useUploadFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadFilePayload) => filesService.upload(payload),
    meta: {
      successMessage: 'Files uploaded successfully',
      errorMessage: 'Upload failed',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filesService.delete(id),
    meta: {
      successMessage: 'File deleted successfully',
      errorMessage: 'Failed to delete file',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useBulkDeleteFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => filesService.bulkDelete(ids),
    meta: {
      successMessage: 'Selected files deleted successfully',
      errorMessage: 'Bulk delete failed',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useRenameFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, originalName }: { id: string; originalName: string }) =>
      filesService.rename(id, originalName),
    meta: {
      successMessage: 'File renamed successfully',
      errorMessage: 'Failed to rename file',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      filesService.download(id, filename),
    meta: {
      successMessage: 'Download started',
      errorMessage: 'Download failed',
    },
  });
}

export function usePreviewFile() {
  return useMutation({
    mutationFn: (id: string) => filesService.preview(id),
    meta: {
      silentSuccess: true,
      errorMessage: 'Preview failed',
    },
  });
}
