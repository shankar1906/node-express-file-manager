import { Router, type IRouter } from 'express';
import { listRoles, getRole } from '../controllers/role.controller';
import { authorize } from '../middleware/rbac.middleware';
import { MODULES, ACTIONS } from '../constants/permissions';

const router: IRouter = Router();

router.get('/', authorize(MODULES.ROLES, ACTIONS.VIEW), listRoles);
router.get('/:id', authorize(MODULES.ROLES, ACTIONS.VIEW), getRole);

export default router;
