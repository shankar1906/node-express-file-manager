import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service';
import { sendSuccess, sendError } from '../utils/response';
import { fileLogger } from '../config/logger';
import { getParam } from '../utils/params';
import type { fileListQuerySchema } from '../validators/auth.validator';
import type { z } from 'zod';

type FileListQuery = z.infer<typeof fileListQuerySchema>;

function fileContext(req: Request, extra: Record<string, unknown> = {}) {
  return {
    requestId: req.requestId,
    userId: req.user?.userId,
    userEmail: req.user?.email,
    ...extra,
  };
}

export async function uploadFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      sendError(res, 'No files provided', 400);
      return;
    }

    const { description, projectName, projectDescription, projectRecordId, fileName, fileNames: fileNamesRaw } = req.body as {
      description?: string;
      projectName?: string;
      projectDescription?: string;
      projectRecordId?: string;
      fileName?: string;
      fileNames?: string | string[];
    };

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    let fileNames: string[] | undefined;
    if (typeof fileNamesRaw === 'string' && fileNamesRaw.trim()) {
      try {
        const parsed = JSON.parse(fileNamesRaw) as unknown;
        if (Array.isArray(parsed)) {
          fileNames = parsed.map((name) => String(name));
        }
      } catch {
        sendError(res, 'Invalid file names payload', 400);
        return;
      }
    } else if (Array.isArray(fileNamesRaw)) {
      fileNames = fileNamesRaw.map((name) => String(name));
    } else if (typeof fileName === 'string' && fileName.trim() && files.length === 1) {
      fileNames = [fileName.trim()];
    }

    const saved = await fileService.uploadFiles({
      files,
      userId: req.user.userId,
      description,
      projectRecordId: projectRecordId?.trim() || undefined,
      projectName: projectName?.trim(),
      projectDescription: projectDescription?.trim(),
      fileNames,
    });

    fileLogger.info('Files uploaded', {
      ...fileContext(req),
      count: saved.length,
      fileNames: saved.map((f) => f.originalName),
    });

    sendSuccess(res, saved, 'Files uploaded successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    if (message.toLowerCase().includes('log in again')) {
      sendError(res, message, 401);
      return;
    }
    next(error);
  }
}

export async function listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await fileService.listFiles(res.locals.validatedQuery as FileListQuery);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = await fileService.getFileById(getParam(req, 'id'));
    if (!file) {
      sendError(res, 'File not found', 404);
      return;
    }
    sendSuccess(res, file);
  } catch (error) {
    next(error);
  }
}

export async function downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const file = await fileService.getFilePath(id);
    if (!file) {
      sendError(res, 'File not found', 404);
      return;
    }

    fileLogger.info('File downloaded', {
      ...fileContext(req, { fileId: id, fileName: file.originalName }),
    });

    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
}

export async function previewFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const file = await fileService.getFilePath(id);
    if (!file) {
      sendError(res, 'File not found', 404);
      return;
    }

    fileLogger.info('File previewed', {
      ...fileContext(req, { fileId: id, fileName: file.originalName }),
    });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(file.path);
  } catch (error) {
    next(error);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const deleted = await fileService.deleteFile(id);
    if (!deleted) {
      sendError(res, 'File not found', 404);
      return;
    }

    fileLogger.info('File deleted', fileContext(req, { fileId: id }));
    sendSuccess(res, null, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids } = req.body as { ids: string[] };
    const result = await fileService.bulkDeleteFiles(ids);

    fileLogger.info('Files bulk deleted', {
      ...fileContext(req),
      count: result.deletedCount,
    });

    sendSuccess(res, result, `${result.deletedCount} file(s) deleted successfully`);
  } catch (error) {
    next(error);
  }
}

export async function renameFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const { originalName } = req.body as { originalName: string };
    const file = await fileService.renameFile(id, originalName);

    if (!file) {
      sendError(res, 'File not found', 404);
      return;
    }

    fileLogger.info('File renamed', fileContext(req, { fileId: id, fileName: file.originalName }));
    sendSuccess(res, file, 'File renamed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rename failed';
    if (message === 'File name is required') {
      sendError(res, message, 400);
      return;
    }
    next(error);
  }
}
