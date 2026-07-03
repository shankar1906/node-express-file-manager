'use client';

import { useRef, useState } from 'react';
import { FolderOpen, X, Eye, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useDeleteFileMutation,
  useDownloadFile,
  useFilesQuery,
  useUploadFilesMutation,
} from '@/hooks/api';
import { useConfirm } from '@/hooks/use-confirm';
import { FilePreviewModal } from '@/components/upload/file-preview-modal';
import { formatDate } from '@/lib/utils';
import type { FileRecord, ProjectRecord } from '@/types';

interface ManageFilesModalProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectRecord | null;
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function ManageFilesModal({ open, onClose, project = null }: ManageFilesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const isExistingProject = Boolean(project);
  const { data, isLoading } = useFilesQuery(
    {
      page: 1,
      limit: 100,
      projectRecordId: project?.id,
    },
    { enabled: isExistingProject }
  );
  const uploadMutation = useUploadFilesMutation();
  const deleteMutation = useDeleteFileMutation();
  const downloadMutation = useDownloadFile();
  const confirm = useConfirm();

  const files = isExistingProject ? (data?.data ?? []) : [];
  const canUpload =
    selectedFiles.length > 0 && (isExistingProject || projectName.trim().length > 0);

  const resetForm = () => {
    setSelectedFiles([]);
    setFileNames({});
    setProjectName('');
    setProjectDescription('');
    setFileDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (fileList: FileList | null) => {
    const nextFiles = fileList ? Array.from(fileList) : [];
    setSelectedFiles(nextFiles);
    setFileNames((prev) => {
      const next: Record<string, string> = {};
      nextFiles.forEach((file) => {
        const key = getFileKey(file);
        next[key] = prev[key] ?? '';
      });
      return next;
    });
  };

  const handleFileNameChange = (file: File, value: string) => {
    const key = getFileKey(file);
    setFileNames((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteFile = async (file: FileRecord) => {
    const confirmed = await confirm({
      title: 'Delete file?',
      description: (
        <>
          Delete <span className="font-semibold">{file.originalName}</span> from this project? This
          action cannot be undone.
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: Trash2,
      variant: 'danger',
    });
    if (!confirmed) return;

    deleteMutation.mutate(file.id);
  };

  const handleUpload = () => {
    if (!canUpload) return;

    const customFileNames = selectedFiles.map(
      (file) => fileNames[getFileKey(file)]?.trim() ?? ''
    );

    uploadMutation.mutate(
      {
        files: selectedFiles,
        projectRecordId: project?.id,
        projectName: project ? undefined : projectName.trim(),
        projectDescription: project ? undefined : projectDescription.trim() || undefined,
        description: fileDescription.trim() || undefined,
        fileNames: customFileNames,
      },
      {
        onSuccess: () => {
          resetForm();
          if (!isExistingProject) {
            handleClose();
          }
        },
      }
    );
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage Attached Documents
                </h3>
                <p className="text-sm text-gray-500">
                  {project
                    ? `Project: ${project.projectName} (${project.projectId})`
                    : 'Create a new project and upload files'}
                </p>
                {project?.description?.trim() ? (
                  <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                ) : null}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto p-5">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Upload New Attachment
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {!isExistingProject ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                        Project Name *
                      </label>
                      <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Q3 Purchase Orders"
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                        Project Description
                      </label>
                      <input
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="e.g. Q3 procurement documents"
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                      />
                    </div>
                  </>
                ) : null}
                <div className={isExistingProject ? 'md:col-span-2' : ''}>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                    Files *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                    File Details / Description
                  </label>
                  <input
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="e.g. Purchase order contract draft"
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>
              </div>

              {selectedFiles.length > 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-700">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Selected Files ({selectedFiles.length})
                  </p>
                  <ul className="space-y-3">
                    {selectedFiles.map((file) => {
                      const fileKey = getFileKey(file);
                      return (
                        <li
                          key={fileKey}
                          className="grid gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-800 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">Original file name</p>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                              File Name
                            </label>
                            <input
                              value={fileNames[fileKey] ?? ''}
                              onChange={(e) => handleFileNameChange(file, e.target.value)}
                              placeholder={file.name}
                              className="h-8 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    Note: If you do not enter a file name, the original selected file name will be
                    used.
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex justify-end">
                <Button
                  size='sm'
                  onClick={handleUpload}
                  loading={uploadMutation.isPending}
                  disabled={!canUpload}
                  className="text-xs"
                >
                  {selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : 'Upload File'}
                </Button>
              </div>
            </div>

            {isExistingProject ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Filename</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Details</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Actions / Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                          Loading files...
                        </td>
                      </tr>
                    ) : files.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                          No files uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      files.map((file) => (
                        <tr key={file.id} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {file.originalName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            <p>{file.description?.trim() || 'No details'}</p>
                            <p className="text-xs">Uploaded: {formatDate(file.uploadedAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Preview
                              </button>
                              <button
                                onClick={() =>
                                  downloadMutation.mutate({
                                    id: file.id,
                                    filename: file.originalName,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <Button variant="secondary" onClick={handleClose}>
              Close Window
            </Button>
          </div>
        </div>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}
