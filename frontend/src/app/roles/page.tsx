'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { useRolesQuery } from '@/hooks/api';

export default function RolesPage() {
  const { data: roles, isLoading } = useRolesQuery();

  return (
    <DashboardLayout title="Roles">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 p-3">
        {isLoading ? (
          <div className="col-span-full flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          roles?.map((role) => (
            <Card key={role.id} className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {role._count?.users ?? 0} users
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {role.permissions?.slice(0, 8).map((p) => (
                  <span
                    key={`${p.module}-${p.action}`}
                    className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                  >
                    {p.module}:{p.action}
                  </span>
                ))}
                {(role.permissions?.length ?? 0) > 8 && (
                  <span className="text-xs text-gray-400">+{role.permissions.length - 8} more</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
