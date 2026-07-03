'use client';

import { useRef, useState } from 'react';
import { Files, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadFilesMutation } from '@/hooks/api';

interface DocumentsUploadModalProps {
  open: boolean;
  onClose: () => void;
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function DocumentsUploadModal({ open, onClose }: DocumentsUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');

  const uploadMutation = useUploadFilesMutation();
  const canUpload = selectedFiles.length > 0;

  const resetForm = () => {
    setSelectedFiles([]);
    setFileNames({});
    setDescription('');
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

  const handleUpload = () => {
    if (!canUpload) return;

    const customFileNames = selectedFiles.map(
      (file) => fileNames[getFileKey(file)]?.trim() ?? ''
    );

    uploadMutation.mutate(
      {
        files: selectedFiles,
        description: description.trim() || undefined,
        fileNames: customFileNames,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950">
              <Files className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Documents</h3>
              <p className="text-sm text-gray-500">Upload standalone documents without a project</p>
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
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">Files *</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
            />
          </div>

          {/* Details / Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
              Details / Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this upload batch"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
            />
          </div>

          {selectedFiles.length > 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-700">
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
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">Original file name</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">File Name</label>
                        <input
                          value={fileNames[fileKey] ?? ''}
                          onChange={(e) =>
                            setFileNames((prev) => ({ ...prev, [fileKey]: e.target.value }))
                          }
                          placeholder={file.name}
                          className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Note: If you do not enter a file name, the original selected file name will be used.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            loading={uploadMutation.isPending}
            disabled={!canUpload}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : 'Upload File'}
          </Button>
        </div>
      </div>
    </div>
  );
}
