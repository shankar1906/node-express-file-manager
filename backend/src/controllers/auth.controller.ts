import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { authLogger } from '../config/logger';

function authContext(req: Request) {
  return {
    requestId: req.requestId,
    userId: req.user?.userId,
    userEmail: req.user?.email,
  };
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, remember } = req.body;
    const result = await authService.login(email, password, remember);

    authLogger.info('User logged in', {
      ...authContext(req),
      email: result.user.email,
      role: result.user.role,
    });

    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    authLogger.warn('Login failed', { ...authContext(req), reason: message });
    sendError(res, message, 401);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);

    authLogger.info('Token refreshed', authContext(req));

    sendSuccess(res, result, 'Token refreshed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    authLogger.warn('Token refresh failed', { ...authContext(req), reason: message });
    sendError(res, message, 401);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await authService.logout(req.user.userId);
      authLogger.info('User logged out', {
        ...authContext(req),
        userId: req.user.userId,
        email: req.user.email,
      });
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}
