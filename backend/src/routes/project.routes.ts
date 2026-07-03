import { Router, type IRouter } from 'express';
import { listProjects, getProject, updateProject, deleteProject } from '../controllers/project.controller';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { projectListQuerySchema, updateProjectSchema } from '../validators/auth.validator';
import { MODULES, ACTIONS } from '../constants/permissions';

const router: IRouter = Router();

router.get(
  '/',
  authorize(MODULES.FILES, ACTIONS.VIEW),
  validateQuery(projectListQuerySchema),
  listProjects
);

router.get(
  '/:id',
  authorize(MODULES.FILES, ACTIONS.VIEW),
  getProject
);

router.patch(
  '/:id',
  authorize(MODULES.FILES, ACTIONS.UPDATE),
  validateBody(updateProjectSchema),
  updateProject
);

router.delete(
  '/:id/delete',
  authorize(MODULES.FILES, ACTIONS.DELETE),
  deleteProject
);

export default router;
