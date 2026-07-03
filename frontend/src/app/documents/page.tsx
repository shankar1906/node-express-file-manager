'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Trash2,
  Pencil,
  RefreshCcw,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { DocumentsUploadModal } from '@/components/documents/documents-upload-modal';
import { FilePreviewModal } from '@/components/upload/file-preview-modal';
import {
  useBulkDeleteFilesMutation,
  useDeleteFileMutation,
  useDownloadFile,
  useFilesQuery,
  useRenameFileMutation,
} from '@/hooks/api';
import { useConfirm } from '@/hooks/use-confirm';
import { formatBytes, formatDate } from '@/lib/utils';
import type { FileRecord } from '@/types';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function DocumentsPage() {
  const gridRef = useRef<AgGridReact<FileRecord>>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renameFile, setRenameFile] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, refetch, isFetching } = useFilesQuery({
    page,
    limit: 20,
    search: search || undefined,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const deleteMutation = useDeleteFileMutation();
  const bulkDeleteMutation = useBulkDeleteFilesMutation();
  const renameMutation = useRenameFileMutation();
  const downloadMutation = useDownloadFile();
  const confirm = useConfirm();

  const files = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const showingFrom = pagination ? Math.max(0, (pagination.page - 1) * pagination.limit + 1) : 0;
  const showingTo = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const updateSelection = (api: GridApi<FileRecord>) => {
    const ids = api.getSelectedRows().map((row) => row.id);
    setSelectedIds(ids);
  };

  const handleDeleteFile = async (file: FileRecord) => {
    const confirmed = await confirm({
      title: 'Delete document?',
      description: (
        <>
          Delete <span className="font-semibold">{file.originalName}</span>? This action cannot be
          undone.
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: 'Delete selected documents?',
      description: `Delete ${selectedIds.length} selected document${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: Trash2,
      variant: 'danger',
    });
    if (!confirmed) return;

    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        gridRef.current?.api.deselectAll();
        setSelectedIds([]);
      },
    });
  };

  const openRename = (file: FileRecord) => {
    setRenameFile(file);
    setRenameValue(file.originalName);
  };

  const handleRename = () => {
    if (!renameFile || !renameValue.trim()) return;
    renameMutation.mutate(
      { id: renameFile.id, originalName: renameValue.trim() },
      {
        onSuccess: () => {
          setRenameFile(null);
          setRenameValue('');
        },
      }
    );
  };

  const columnDefs = useMemo<ColDef<FileRecord>[]>(
    () => [
      {
        headerName: '',
        width: 48,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        sortable: false,
        filter: false,
        resizable: false,
      },
      {
        field: 'originalName',
        headerName: 'FILE NAME',
        filter: true,
        flex: 2,
        cellClass: 'font-medium text-gray-900 dark:text-white flex items-center',
      },
      {
        field: 'projectId',
        headerName: 'PROJECT ID',
        filter: true,
        width: 130,
        valueFormatter: (p) => p.value ?? '-',
        cellClass: 'text-blue-600 flex items-center',
      },
      {
        field: 'projectName',
        headerName: 'PROJECT NAME',
        filter: true,
        flex: 1.5,
        valueFormatter: (p) => p.value ?? '-',
        cellClass: 'flex items-center',
      },
      {
        field: 'extension',
        headerName: 'TYPE',
        filter: true,
        width: 100,
        valueFormatter: (p) => p.value?.toUpperCase() ?? '-',
      },
      {
        field: 'size',
        headerName: 'SIZE',
        filter: true,
        width: 110,
        valueFormatter: (p) => formatBytes(p.value ?? 0),
      },
      // {
      //   field: 'uploadedBy',
      //   headerName: 'UPLOADED BY',
      //   filter: true,
      //   width: 150,
      //   valueGetter: (p) => p.data?.uploadedBy?.name ?? '-',
      // },
      {
        field: 'uploadedAt',
        headerName: 'UPLOADED',
        filter: true,
        width: 170,
        valueFormatter: (p) => (p.value ? formatDate(p.value).split(',')[0] : '-'),
      },
      {
        headerName: 'ACTIONS',
        width: 180,
        cellRenderer: (params: ICellRendererParams<FileRecord>) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => params.data && setPreviewFile(params.data)}
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                params.data &&
                downloadMutation.mutate({ id: params.data.id, filename: params.data.originalName })
              }
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => params.data && openRename(params.data)}
              className="rounded p-1 text-gray-600 hover:bg-gray-50"
              title="Rename"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => params.data && handleDeleteFile(params.data)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [downloadMutation, handleDeleteFile]
  );

  return (
    <DashboardLayout title="Documents">
      <div className="space-y-4">
        <div className="flex justify-between py-2 mb-0">

          <div className="flex items-center gap-2 ms-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search documents..."
                className="h-8 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => refetch()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Refresh documents"
            >
              <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className='flex gap-2 me-2'>
            {selectedIds.length > 0 && (
              <Button
                variant='danger'
                size='sm'
                disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> ({selectedIds.length})
              </Button>
            )}
            <Button onClick={() => setUploadOpen(true)} size='sm' className='text-xs'>
              <Plus className="h-4 w-4" />
              Uploads
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
            <p className="text-xs text-gray-400">{total} total documents</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Refresh
            </button>
          </div> */}

          <div className="ag-theme-quartz w-full" style={{ height: '80dvh' }}>
            <AgGridReact
              ref={gridRef}
              rowData={files}
              columnDefs={columnDefs}
              rowSelection="multiple"
              suppressRowClickSelection
              headerHeight={35}
              rowHeight={34}
              onSelectionChanged={(event) => updateSelection(event.api)}
              defaultColDef={{ sortable: true, resizable: true, filter: true }}
              animateRows
              pagination={false}
              loading={isLoading}
              getRowId={(params) => params.data.id}
              overlayNoRowsTemplate={
                isLoading
                  ? `<div class="flex h-full items-center justify-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>`
                  : `<div class="py-8 text-center text-gray-500">No documents found.</div>`
              }
            />
          </div>

          {pagination && pagination.total > 0 ? (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-[11px] text-gray-400 dark:border-gray-800">
              <span>
                Showing {showingFrom} to {showingTo} of {total} documents
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="p-1 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="p-1 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DocumentsUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {renameFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rename File</h3>
            <p className="mt-1 text-sm text-gray-500">Update the display name for this document.</p>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-4 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenameFile(null)}>
                Cancel
              </Button>
              <Button onClick={handleRename} loading={renameMutation.isPending}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
