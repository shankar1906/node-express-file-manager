'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Eye, Download, Trash2 } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import type { FileRecord } from '@/types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useTheme } from 'next-themes';

ModuleRegistry.registerModules([AllCommunityModule]);

interface FilesDataGridProps {
  files: FileRecord[];
  onPreview: (file: FileRecord) => void;
  onDownload: (file: FileRecord) => void;
  onDelete: (id: string) => void;
}

export function FilesDataGrid({ files, onPreview, onDownload, onDelete }: FilesDataGridProps) {
  const [mounted, setMounted] = useState(false);
  const gridRef = useRef<AgGridReact<FileRecord>>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const columnDefs = useMemo<ColDef<FileRecord>[]>(
    () => [
      {
        headerName: 'Preview',
        width: 90,
        cellRenderer: (params: ICellRendererParams<FileRecord>) => (
          <button
            onClick={() => params.data && onPreview(params.data)}
            className="flex h-full items-center justify-center text-blue-600 hover:text-blue-700"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
      { field: 'originalName', headerName: 'File Name', flex: 2, filter: true },
      { field: 'projectName', headerName: 'Project Name', flex: 1.5, filter: true },
      { field: 'projectId', headerName: 'Project ID', width: 130, filter: true },
      { field: 'extension', headerName: 'File Type', width: 110 },
      {
        field: 'size',
        headerName: 'Size',
        width: 120,
        valueFormatter: (p) => formatBytes(p.value ?? 0),
      },
      {
        field: 'uploadedBy',
        headerName: 'Uploaded By',
        width: 160,
        valueGetter: (p) => p.data?.uploadedBy?.name ?? '-',
      },
      {
        field: 'uploadedAt',
        headerName: 'Upload Date',
        width: 170,
        valueFormatter: (p) => (p.value ? formatDate(p.value) : '-'),
      },
      { field: 'status', headerName: 'Status', width: 120 },
      {
        headerName: 'Actions',
        width: 160,
        cellRenderer: (params: ICellRendererParams<FileRecord>) => (
          <div className="flex h-full items-center gap-1">
            <button
              onClick={() => params.data && onDownload(params.data)}
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => params.data && params.data.id && onDelete(params.data.id)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [onPreview, onDownload, onDelete]
  );

  if (!mounted) {
    return (
      <div className="flex h-[520px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={mounted && resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} style={{ height: 520, width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={files}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true, filter: true }}
        animateRows
        pagination={false}
      />
    </div>
  );
}
