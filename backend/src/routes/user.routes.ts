import { Router, type IRouter } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validators/auth.validator';
import { MODULES, ACTIONS } from '../constants/permissions';

const router: IRouter = Router();

router.get('/', authorize(MODULES.USERS, ACTIONS.VIEW), listUsers);
router.get('/:id', authorize(MODULES.USERS, ACTIONS.VIEW), getUser);
router.post(
  '/',
  authorize(MODULES.USERS, ACTIONS.CREATE),
  validateBody(createUserSchema),
  createUser
);
router.put(
  '/:id',
  authorize(MODULES.USERS, ACTIONS.UPDATE),
  validateBody(updateUserSchema),
  updateUser
);
router.delete('/:id', authorize(MODULES.USERS, ACTIONS.DELETE), deleteUser);

export default router;
