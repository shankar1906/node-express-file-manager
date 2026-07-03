import { Request, Response, NextFunction } from 'express';
import { errorLogger } from '../config/logger';
import { sendError } from '../utils/response';

function getErrorContext(req: Request) {
  return {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    userId: req.user?.userId,
    userEmail: req.user?.email,
    ip: req.ip,
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  errorLogger.error(err.message, {
    ...getErrorContext(req),
    stack: err.stack,
    statusCode: res.statusCode || 500,
  });

  sendError(res, err.message || 'Internal server error', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  errorLogger.warn('Route not found', getErrorContext(req));
  sendError(res, 'Route not found', 404);
}
