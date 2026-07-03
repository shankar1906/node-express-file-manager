import { prisma } from '../config/database';

export class ProjectService {
  async listProjects(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { projectName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const sortField =
      sortBy === 'projectId'
        ? 'code'
        : sortBy === 'createdAt'
          ? 'createdAt'
          : sortBy === 'totalFiles'
            ? 'totalFiles'
            : 'projectName';

    const orderBy = { [sortField]: sortOrder };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((project) => this.serializeProject(project)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return null;
    return this.serializeProject(project);
  }

  async updateProject(
    id: string,
    data: { projectName?: string; description?: string; status?: string }
  ) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return null;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.projectName !== undefined ? { projectName: data.projectName } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    return this.serializeProject(updated);
  }

  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return false;

    await prisma.project.delete({ where: { id } });
    return true;
  }

  private serializeProject(project: {
    id: string;
    code: string;
    projectName: string;
    description: string | null;
    status: string;
    totalFiles: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: project.id,
      projectId: project.code,
      projectName: project.projectName,
      description: project.description,
      status: project.status,
      totalFiles: project.totalFiles,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}

export const projectService = new ProjectService();
