import { API_BASE_URL } from '@/constants';
import { apiClient, downloadBlob, getStoredAccessToken } from '@/lib/api';
import { ApiError } from '@/lib/api/errors';
import type { FileRecord, PaginatedFiles } from '@/types';

export interface FileListParams {
  page?: number;
  limit?: number;
  search?: string;
  projectRecordId?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UploadFilePayload {
  files: File[];
  projectName?: string;
  projectRecordId?: string;
  projectDescription?: string;
  description?: string;
  fileName?: string;
  fileNames?: string[];
}

async function fetchAuthenticatedBlob(path: string): Promise<Blob> {
  const token = getStoredAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new ApiError('Preview failed', response.status);
  }

  return response.blob();
}

export const filesService = {
  list(params: FileListParams) {
    return apiClient.get<PaginatedFiles>('/files', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  upload({ files, projectName, projectRecordId, projectDescription, description, fileName, fileNames }: UploadFilePayload) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (projectRecordId) {
      formData.append('projectRecordId', projectRecordId);
    }
    if (projectName) {
      formData.append('projectName', projectName);
    }
    if (projectDescription) {
      formData.append('projectDescription', projectDescription);
    }
    if (description) {
      formData.append('description', description);
    }
    if (fileNames && fileNames.length > 0) {
      formData.append('fileNames', JSON.stringify(fileNames));
    } else if (fileName) {
      formData.append('fileName', fileName);
    }
    return apiClient.post<FileRecord[]>('/files/upload', formData);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/files/${id}/delete`);
  },

  bulkDelete(ids: string[]) {
    return apiClient.post<{ deletedCount: number }>('/files/bulk-delete', { ids });
  },

  rename(id: string, originalName: string) {
    return apiClient.patch<FileRecord>(`/files/${id}/rename`, { originalName });
  },

  download(id: string, filename: string) {
    return downloadBlob(`/files/${id}/download`, filename);
  },

  preview(id: string) {
    return fetchAuthenticatedBlob(`/files/${id}/preview`);
  },
};
