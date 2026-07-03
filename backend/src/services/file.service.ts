import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { env } from '../utils/env';
import { generateCustomId, isValidUuid } from '../utils/uuid';

type FileWithRelations = {
  id: string;
  fileName: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: bigint;
  path: string;
  status: string;
  description?: string | null;
  createdAt: Date;
  checksum?: string | null;
  project: {
    code: string;
    projectName: string;
    totalFiles: number;
  } | null;
};

export class FileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.upload.dir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFiles({
    files,
    userId,
    description,
    projectName,
    projectRecordId,
    projectDescription,
    fileNames,
  }: {
    files: Express.Multer.File[];
    userId: string;
    description?: string;
    projectName?: string;
    projectRecordId?: string;
    projectDescription?: string;
    fileNames?: string[];
  }) {
    if (!isValidUuid(userId)) {
      throw new Error('Invalid session. Please log in again.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new Error('User not found. Please log in again.');
    }

    const session = await prisma.uploadSession.create({
      data: { uploadedById: userId },
    });

    let project = null;

    if (projectRecordId) {
      project = await prisma.project.findUnique({ where: { id: projectRecordId } });
      if (!project) {
        throw new Error('Project not found');
      }
    } else if (projectName?.trim()) {
      const { _max } = await prisma.project.aggregate({ _max: { sno: true } });
      const nextSno = (_max.sno ?? 0) + 1;
      const projectCode = generateCustomId('P', nextSno);

      project = await prisma.project.create({
        data: {
          code: projectCode,
          projectName: projectName.trim(),
          description: projectDescription?.trim() || null,
          totalFiles: 0,
        },
      });
    }

    const saved = await Promise.all(
      files.map(async (file, index) => {
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        const storedFileName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
        const filePath = path.join(this.uploadDir, storedFileName);
        const customName = fileNames?.[index]?.trim();
        const originalName = customName
          ? customName.includes('.')
            ? customName
            : `${customName}${path.extname(file.originalname)}`
          : file.originalname;

        fs.writeFileSync(filePath, file.buffer);

        const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

        return prisma.file.create({
          data: {
            projectId: project?.id ?? null,
            uploadSessionId: session.id,
            fileName: storedFileName,
            originalName,
            extension: ext,
            mimeType: file.mimetype,
            size: BigInt(file.size),
            path: filePath,
            storageProvider: 'disk',
            checksum,
            description: description || null,
            status: 'completed',
          },
          include: {
            project: true,
          },
        });
      })
    );

    if (project) {
      await prisma.project.update({
        where: { id: project.id },
        data: { totalFiles: { increment: saved.length } },
      });
    }

    return saved.map((f) => this.serializeFile(f));
  }

  async listFiles(params: {
    page: number;
    limit: number;
    search?: string;
    projectRecordId?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, search, projectRecordId, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(projectRecordId ? { projectId: projectRecordId } : {}),
      ...(search
        ? {
            OR: [
              { originalName: { contains: search, mode: 'insensitive' as const } },
              { fileName: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { project: { is: { projectName: { contains: search, mode: 'insensitive' as const } } } },
              { project: { is: { code: { contains: search, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    };

    const dbSortBy =
      sortBy === 'uploadedAt'
        ? 'createdAt'
        : sortBy === 'projectName'
          ? { project: { projectName: sortOrder } }
          : sortBy === 'projectId'
            ? { project: { code: sortOrder } }
            : sortBy;

    const orderBy =
      typeof dbSortBy === 'string' ? { [dbSortBy]: sortOrder } : dbSortBy;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          project: true,
          uploadSession: {
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      data: files.map((f) => ({
        ...this.serializeFile(f),
        uploadedBy: f.uploadSession.uploadedBy,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFileById(id: string) {
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        project: true,
        uploadSession: {
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!file) return null;

    return {
      ...this.serializeFile(file),
      uploadedBy: file.uploadSession.uploadedBy,
    };
  }

  async renameFile(id: string, originalName: string) {
    const trimmed = originalName.trim();
    if (!trimmed) {
      throw new Error('File name is required');
    }

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return null;

    const nextName = trimmed.includes('.') ? trimmed : `${trimmed}.${file.extension}`;

    const updated = await prisma.file.update({
      where: { id },
      data: { originalName: nextName },
      include: {
        project: true,
        uploadSession: {
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return {
      ...this.serializeFile(updated),
      uploadedBy: updated.uploadSession.uploadedBy,
    };
  }

  async deleteFile(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return false;

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await prisma.file.delete({ where: { id } });

    if (file.projectId) {
      await prisma.project.update({
        where: { id: file.projectId },
        data: { totalFiles: { decrement: 1 } },
      });
    }

    return true;
  }

  async bulkDeleteFiles(ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return { deletedCount: 0 };

    const files = await prisma.file.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, path: true, projectId: true },
    });

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    const projectCounts = files.reduce<Record<string, number>>((acc, file) => {
      if (!file.projectId) return acc;
      acc[file.projectId] = (acc[file.projectId] ?? 0) + 1;
      return acc;
    }, {});

    await prisma.$transaction([
      prisma.file.deleteMany({ where: { id: { in: files.map((file) => file.id) } } }),
      ...Object.entries(projectCounts).map(([projectId, count]) =>
        prisma.project.update({
          where: { id: projectId },
          data: { totalFiles: { decrement: count } },
        })
      ),
    ]);

    return { deletedCount: files.length };
  }

  getFilePath(id: string) {
    return prisma.file.findUnique({ where: { id } });
  }

  private serializeFile(file: FileWithRelations) {
    return {
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      projectId: file.project?.code ?? null,
      projectName: file.project?.projectName ?? null,
      projectTotalFiles: file.project?.totalFiles ?? null,
      extension: file.extension,
      mimeType: file.mimeType,
      size: Number(file.size),
      path: file.path,
      status: file.status,
      description: file.description ?? null,
      uploadedAt: file.createdAt,
      checksum: file.checksum ?? null,
    };
  }
}

export const fileService = new FileService();
