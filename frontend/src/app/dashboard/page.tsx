'use client';

import { FileText, HardDrive, Upload, Users, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard, Card, CardHeader, CardContent } from '@/components/ui/card';
import { useDashboardQuery } from '@/hooks/api';
import { formatBytes, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDashboardQuery();

  return (
    <DashboardLayout title="Home">
      <div className="space-y-6 p-3">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome {user?.name?.split(' ')[0] ?? 'User'}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Files" value={data?.totalFiles ?? 0} icon={FileText} />
              <StatCard title="Storage Used" value={formatBytes(data?.storageUsed ?? 0)} icon={HardDrive} />
              <StatCard title="Today's Uploads" value={data?.todayUploads ?? 0} icon={Upload} />
              <StatCard title="Total Users" value={data?.totalUsers ?? 0} icon={Users} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Upload Trend (7 days)</h3>
                </CardHeader>
                <CardContent>
                  {data?.uploadTrend?.length ? (
                    <div className="space-y-2">
                      {data.uploadTrend.map((row) => (
                        <div key={row.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{formatDate(row.date)}</span>
                          <span className="font-medium">{row.count} files</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No uploads in the last 7 days</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Uploads</h3>
                </CardHeader>
                <CardContent>
                  {data?.recentFiles?.length ? (
                    <div className="space-y-3">
                      {data.recentFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 truncate">
                            <p className="truncate font-medium">{file.originalName}</p>
                            <p className="text-xs text-gray-500">{formatDate(file.uploadedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-gray-400">
                      <Upload className="mb-2 h-8 w-8" />
                      <p className="text-sm">No files uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
