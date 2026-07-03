import { Router, type IRouter } from 'express';
import dashboardRoutes from './dashboard.routes';
import projectRoutes from './project.routes';
import fileRoutes from './file.routes';

import userRoutes from './user.routes';

import roleRoutes from './role.routes';

const router: IRouter = Router();

router.use('/dashboard', dashboardRoutes);

router.use('/projects', projectRoutes);

router.use('/files', fileRoutes);

router.use('/users', userRoutes);

router.use('/roles', roleRoutes);

export default router;
