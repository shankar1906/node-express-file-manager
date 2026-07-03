import { Router, type IRouter } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authorize } from '../middleware/rbac.middleware';
import { MODULES, ACTIONS } from '../constants/permissions';

const router: IRouter = Router();

router.get('/',authorize(MODULES.DASHBOARD, ACTIONS.VIEW), getDashboard);

export default router;
