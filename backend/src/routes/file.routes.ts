import { Router, type IRouter } from 'express';
import {
  uploadFiles,
  listFiles,
  getFile,
  downloadFile,
  previewFile,
  deleteFile,
  bulkDeleteFiles,
  renameFile,
} from '../controllers/file.controller';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { handleFileUpload } from '../middleware/upload.middleware';
import {
  bulkDeleteFilesSchema,
  fileListQuerySchema,
  renameFileSchema,
} from '../validators/auth.validator';
import { MODULES, ACTIONS } from '../constants/permissions';

const router: IRouter = Router();

router.post(
  '/upload',
  authorize(MODULES.UPLOAD, ACTIONS.CREATE),
  handleFileUpload,
  uploadFiles
);

router.get(
  '/',
  authorize(MODULES.FILES, ACTIONS.VIEW),
  validateQuery(fileListQuerySchema),
  listFiles
);

router.post(
  '/bulk-delete',
  authorize(MODULES.DELETE, ACTIONS.DELETE),
  validateBody(bulkDeleteFilesSchema),
  bulkDeleteFiles
);

router.get(
  '/:id/preview',
  authorize(MODULES.FILES, ACTIONS.VIEW),
  previewFile
);

router.get(
  '/:id/download',
  authorize(MODULES.DOWNLOAD, ACTIONS.VIEW),
  downloadFile
);

router.patch(
  '/:id/rename',
  authorize(MODULES.FILES, ACTIONS.UPDATE),
  validateBody(renameFileSchema),
  renameFile
);

router.delete(
  '/:id/delete',
  authorize(MODULES.DELETE, ACTIONS.DELETE),
  deleteFile
);

router.get(
  '/:id',
  authorize(MODULES.FILES, ACTIONS.VIEW),
  getFile
);

export default router;
