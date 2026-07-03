import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import type { ActionName, ModuleName } from '../constants/permissions';

export function authorize(module: ModuleName, action: ActionName) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const permission = await prisma.permission.findFirst({
      where: {
        roleId: req.user.roleId,
        module,
        action,
      },
    });

    if (!permission) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }

    next();
  };
}
