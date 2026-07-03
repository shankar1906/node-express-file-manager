'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  getFilterValue?: (row: T) => string;
  filterable?: boolean;
  className?: string;
  headerClassName?: string;
  truncate?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  entityNamePlural: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  toolbarRight?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  enableColumnFilters?: boolean;
  defaultPageSize?: number;
}

function CellValue({
  children,
  truncate,
}: {
  children: ReactNode;
  truncate?: boolean;
}) {
  if (children === null || children === undefined || children === '') {
    return <span className="text-gray-400">-</span>;
  }

  if (truncate) {
    return <span className="block truncate">{children}</span>;
  }

  return <>{children}</>;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  entityNamePlural,
  isLoading = false,
  emptyState,
  toolbarRight,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  page: controlledPage,
  pageSize: controlledPageSize,
  total: controlledTotal,
  totalPages: controlledTotalPages,
  onPageChange,
  enableColumnFilters = false,
  defaultPageSize = 20,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  const isServerPagination = onPageChange !== undefined;
  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? defaultPageSize;

  const filteredData = useMemo(() => {
    if (isServerPagination || !enableColumnFilters) {
      return data;
    }

    return data.filter((row) =>
      columns.every((column) => {
        const filterValue = columnFilters[column.id]?.trim().toLowerCase();
        if (!filterValue || !column.getFilterValue) return true;
        return column.getFilterValue(row).toLowerCase().includes(filterValue);
      })
    );
  }, [columnFilters, columns, data, enableColumnFilters, isServerPagination]);

  const total = controlledTotal ?? filteredData.length;
  const totalPages =
    controlledTotalPages ?? Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(() => {
    if (isServerPagination) return data;
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [data, filteredData, isServerPagination, page, pageSize]);

  const rows = isServerPagination ? data : paginatedData;
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }
    setInternalPage(nextPage);
  };

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [columnId]: value }));
    if (!isServerPagination) {
      setInternalPage(1);
    }
  };

  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-850 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-850 bg-white dark:bg-gray-900">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {total} total {entityNamePlural}
        </p>
        <div className="flex items-center gap-2">
          {onSearchChange ? (
            <div className="relative w-full sm:w-64">
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-[34px] w-full rounded border border-gray-200 bg-white px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
              />
            </div>
          ) : null}
          {toolbarRight}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'border-r border-gray-200 px-4 py-2.5 text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase last:border-r-0 dark:border-gray-800',
                    column.headerClassName
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{column.header}</span>
                    {column.filterable && enableColumnFilters ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveFilterColumn((current) =>
                            current === column.id ? null : column.id
                          )
                        }
                        className={cn(
                          'rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800',
                          activeFilterColumn === column.id && 'bg-gray-100 text-gray-600'
                        )}
                        aria-label={`Filter ${column.header}`}
                      >
                        <Filter className="h-3 w-3" />
                      </button>
                    ) : column.filterable ? (
                      <Filter className="h-3 w-3 text-gray-305" />
                    ) : null}
                  </div>
                  {enableColumnFilters && activeFilterColumn === column.id ? (
                    <input
                      value={columnFilters[column.id] ?? ''}
                      onChange={(e) => handleColumnFilterChange(column.id, e.target.value)}
                      placeholder={`Filter ${column.header.toLowerCase()}`}
                      className="mt-1.5 h-7 w-full rounded border border-gray-200 px-2 text-[10px] font-normal normal-case focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-500">
                  {emptyState ?? `No ${entityNamePlural} found.`}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-gray-200/80 text-gray-850 dark:border-gray-800 dark:text-gray-200',
                    rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-[#f9fafb] dark:bg-gray-950/40'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'border-r border-gray-200/80 px-4 py-3 last:border-r-0 dark:border-gray-800',
                        column.className
                      )}
                    >
                      <CellValue truncate={column.truncate}>
                        {column.accessor(row)}
                      </CellValue>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-[11px] text-gray-400 dark:border-gray-850 bg-white dark:bg-gray-900">
          <span>
            Showing {showingFrom} to {showingTo} of {total} {entityNamePlural}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 text-gray-450 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-gray-200"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[11px] text-gray-400 px-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 text-gray-455 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-gray-200"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
