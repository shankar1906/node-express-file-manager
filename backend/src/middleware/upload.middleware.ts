import { Request, Response, NextFunction } from 'express';
import multer, { type MulterError } from 'multer';
import { env } from '../utils/env';
import { formatBytes } from '../utils/format';
import { sendError } from '../utils/response';

export const maxUploadFileSizeBytes = env.upload.maxFileSizeMb * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadFileSizeBytes },
});

function isMulterError(error: unknown): error is MulterError {
  return error instanceof multer.MulterError;
}

export function handleFileUpload(req: Request, res: Response, next: NextFunction): void {
  upload.array('files', 20)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (isMulterError(error)) {
      const maxSizeLabel = formatBytes(maxUploadFileSizeBytes);
      const uploadSize = Number(req.headers['content-length'] ?? 0);
      const uploadSizeLabel = uploadSize > 0 ? formatBytes(uploadSize) : null;

      if (error.code === 'LIMIT_FILE_SIZE') {
        const message = uploadSizeLabel
          ? `File too large. Maximum allowed size is ${maxSizeLabel} per file. Your upload is approximately ${uploadSizeLabel}.`
          : `File too large. Maximum allowed size is ${maxSizeLabel} per file.`;
        sendError(res, message, 413);
        return;
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        sendError(res, 'Too many files. Maximum 20 files per upload.', 400);
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        sendError(res, 'Unexpected file field in upload request.', 400);
        return;
      }
    }

    next(error);
  });
}
