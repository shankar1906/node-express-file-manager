import { prisma } from '../config/database';

export class DashboardService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFiles, totalUsers, todayUploads, storageResult] = await Promise.all([
      prisma.file.count(),
      prisma.user.count(),
      prisma.file.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.file.aggregate({ _sum: { size: true } }),
    ]);

    const storageUsed = Number(storageResult._sum.size ?? 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFiles = await prisma.file.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadSession: {
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const uploadTrend = await prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "File"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return {
      totalFiles,
      totalUsers,
      todayUploads,
      storageUsed,
      recentFiles: recentFiles.map((f) => ({
        id: f.id,
        fileName: f.originalName,
        mimeType: f.mimeType,
        size: Number(f.size),
        status: f.status,
        uploadedAt: f.createdAt,
        uploadedBy: f.uploadSession.uploadedBy,
      })),
      uploadTrend: uploadTrend.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    };
  }
}

export const dashboardService = new DashboardService();
