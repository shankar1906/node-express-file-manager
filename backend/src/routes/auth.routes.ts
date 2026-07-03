import { Router, type IRouter } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router: IRouter = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshTokenSchema), refresh);
router.post('/logout', authenticate, logout);

export default router;
