'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, RefreshCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useUsersQuery } from '@/hooks/api';
import { formatDate } from '@/lib/utils';
import type { UserRecord } from '@/types';

import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useTheme } from 'next-themes';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: users = [], isLoading, refetch, isFetching } = useUsersQuery();

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const haystack = [user.name, user.email, user.role?.name, user.createdAt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, users]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const columnDefs = useMemo<ColDef<UserRecord>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        filter: true,
        flex: 1.5,
        cellClass: 'font-medium text-gray-900 dark:text-white flex items-center',
      },
      {
        field: 'email',
        headerName: 'Email',
        filter: true,
        flex: 2,
        cellClass: 'flex items-center',
      },
      {
        field: 'role',
        headerName: 'Role',
        filter: true,
        width: 140,
        cellClass: 'flex items-center',
        valueGetter: (p) => p.data?.role?.name ?? '',
        cellRenderer: (params: ICellRendererParams<UserRecord>) => (
          params.data ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              {params.data.role.name}
            </span>
          ) : null
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        filter: true,
        width: 170,
        cellClass: 'flex items-center',
        valueFormatter: (p) => (p.value ? formatDate(p.value).split(",")[0] : '-'),
      },
    ],
    []
  );

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <DashboardLayout title="Users">
      <div className="space-y-4">
        {/* Styled AG Grid Container matching target image */}
        <div className="overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {total} total users
            </p>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search users..."
                  className="h-[34px] w-full rounded border border-gray-200 bg-white px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                />
                <Search className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              </div>
              <button
                type="button"
                disabled={isFetching}
                onClick={() => refetch()}
                className="flex h-[34px] w-[34px] items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-900 dark:hover:text-gray-200"
                aria-label="Refresh users"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Grid body */}
          <div className={`${mounted && resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} w-full`} style={{ height: '80dvh' }}>
            <AgGridReact
              rowData={paginatedUsers}
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
                  : `<div class="flex flex-col items-center gap-2 py-4"><p class="font-medium text-gray-600 dark:text-gray-300">No users found.</p></div>`
              }
            />
          </div>

          {/* Bottom pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-[11px] text-gray-400 dark:border-gray-800 bg-white dark:bg-gray-900">
              <span>
                Showing {showingFrom} to {showingTo} of {total} users
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-gray-200"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[11px] text-gray-400 px-1">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-gray-200"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
