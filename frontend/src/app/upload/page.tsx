'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FolderOpen, ChevronLeft, ChevronRight, Pencil, Trash2, RefreshCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ManageFilesModal } from '@/components/upload/manage-files-modal';
import { useDeleteProjectMutation, useProjectsQuery, useUpdateProjectMutation } from '@/hooks/api';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/utils';
import type { ProjectRecord } from '@/types';

import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useTheme } from 'next-themes';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function UploadPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [editProject, setEditProject] = useState<ProjectRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  const confirm = useConfirm();

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.classList.add('upload-print-blocked');

    const blockPrintShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
      }
    };

    const blockPrint = () => {
      window.focus();
    };

    window.addEventListener('keydown', blockPrintShortcut);
    window.addEventListener('beforeprint', blockPrint);

    return () => {
      document.body.classList.remove('upload-print-blocked');
      window.removeEventListener('keydown', blockPrintShortcut);
      window.removeEventListener('beforeprint', blockPrint);
    };
  }, []);

  const { data, isLoading, refetch, isFetching } = useProjectsQuery({
    page,
    limit: 20,
    search: search || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const projects = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const showingFrom = pagination ? Math.max(0, (pagination.page - 1) * pagination.limit + 1) : 0;
  const showingTo = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const openManageModal = (project?: ProjectRecord) => {
    setSelectedProject(project ?? null);
    setManageOpen(true);
  };

  const closeManageModal = () => {
    setManageOpen(false);
    setSelectedProject(null);
  };

  const openEditModal = (project: ProjectRecord) => {
    setEditProject(project);
    setEditName(project.projectName);
    setEditDescription(project.description ?? '');
  };

  const handleUpdateProject = () => {
    if (!editProject || !editName.trim()) return;

    updateProjectMutation.mutate(
      {
        id: editProject.id,
        projectName: editName.trim(),
        description: editDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setEditProject(null);
          setEditName('');
          setEditDescription('');
        },
      }
    );
  };

  const handleDeleteProject = async (project: ProjectRecord) => {
    const confirmed = await confirm({
      title: 'Delete project?',
      description: (
        <>
          Delete project <span className="font-semibold">{project.projectName}</span> (
          {project.projectId})? Documents will be kept and moved out of this project.
        </>
      ),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: Trash2,
      variant: 'danger',
    });
    if (!confirmed) return;

    deleteProjectMutation.mutate(project.id);
  };

  const columnDefs = useMemo<ColDef<ProjectRecord>[]>(
    () => [
      {
        field: 'projectId',
        headerName: 'PROJECT ID',
        filter: true,
        width: 140,
        pinned: 'left',
        cellClass: 'font-semibold text-blue-600 flex items-center',
      },
      {
        field: 'projectName',
        headerName: 'PROJECT NAME',
        filter: true,
        flex: 2,
        cellClass: 'font-semibold text-gray-900 dark:text-white flex items-center',
      },
      {
        field: 'description',
        headerName: 'DESCRIPTION',
        filter: true,
        flex: 2,
        valueFormatter: (p) => p.value?.trim() || '-',
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        field: 'totalFiles',
        headerName: 'ATTACHED DOCUMENTS',
        filter: true,
        width: 220,
        cellRenderer: (params: ICellRendererParams<ProjectRecord>) => {
          const count = params.data?.totalFiles ?? 0;
          return (
            <button
              type="button"
              onClick={() => params.data && openManageModal(params.data)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {count > 0 ? `${count} Document${count === 1 ? '' : 's'}` : 'Manage Documents'}
            </button>
          );
        },
      },
      {
        field: 'createdAt',
        headerName: 'CREATED',
        filter: true,
        width: 180,
        valueFormatter: (p) => (p.value ? formatDate(p.value).split(",")[0] : '-'),
        cellClass: 'flex items-center text-gray-600',
      },
      {
        headerName: 'ACTIONS / PERMISSIONS',
        width: 220,
        cellRenderer: (params: ICellRendererParams<ProjectRecord>) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => params.data && openManageModal(params.data)}
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
              title="Manage Documents"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => params.data && openEditModal(params.data)}
              className="rounded p-1 text-gray-600 hover:bg-gray-50"
              title="Edit Project"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => params.data && handleDeleteProject(params.data)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Delete Project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayout title="Upload">
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
                placeholder="Search projects..."
                className="h-8 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => refetch()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Refresh projects"
            >
              <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Button onClick={() => openManageModal()} className="py-1 px-2 me-2 text-xs" size='sm'>
            <Plus className="h-3 w-3" />
            Add Project
          </Button>
        </div>


        <div className="overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
            <p className="text-xs text-gray-400">{total} total projects</p>
          </div> */}

          <div className={`${mounted && resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} w-full`} style={{ height: '85dvh' }}>
            <AgGridReact
              rowData={projects}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                resizable: true,
                filter: true,
              }}
              headerHeight={35}
              rowHeight={34}
              animateRows
              pagination={false}
              loading={isLoading}
              overlayNoRowsTemplate={
                isLoading
                  ? `<div class="flex h-full items-center justify-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>`
                  : `<div class="py-8 text-center text-gray-500">No projects found. Click "Add Project" to create one.</div>`
              }
            />
          </div>

          {pagination && pagination.total > 0 ? (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-[11px] text-gray-400 dark:border-gray-800">
              <span>
                Showing {showingFrom} to {showingTo} of {total} projects
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-1">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ManageFilesModal
        open={manageOpen}
        onClose={closeManageModal}
        project={selectedProject}
      />

      {editProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Project</h3>
            <p className="mt-1 text-sm text-gray-500">{editProject.projectId}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                  Project Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase">
                  Project Description
                </label>
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional project description"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditProject(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} loading={updateProjectMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
