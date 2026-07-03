import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';
import { sendSuccess, sendError } from '../utils/response';
import { getParam } from '../utils/params';

export async function listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await roleService.listRoles();
    sendSuccess(res, roles);
  } catch (error) {
    next(error);
  }
}

export async function getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await roleService.getRoleById(getParam(req, 'id'));
    if (!role) {
      sendError(res, 'Role not found', 404);
      return;
    }
    sendSuccess(res, role);
  } catch (error) {
    next(error);
  }
}
