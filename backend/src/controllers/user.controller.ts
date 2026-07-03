import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { getParam } from '../utils/params';

export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.listUsers();
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(getParam(req, 'id'));
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    sendSuccess(res, user, 'User created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateUser(getParam(req, 'id'), req.body);
    sendSuccess(res, user, 'User updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(getParam(req, 'id'));
    sendSuccess(res, null, 'User deleted');
  } catch (error) {
    next(error);
  }
}
