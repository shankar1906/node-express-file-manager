import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { httpLogger, logLevelForStatus } from '../config/logger';
import { env } from '../utils/env';

const SENSITIVE_PATHS = ['/auth/login', '/auth/refresh'];

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function shouldSkipVerboseLog(req: Request): boolean {
  return req.path === '/health' && env.isProduction;
}

export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.requestId);

  const requestMeta = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.get('user-agent') ?? 'unknown',
    userId: req.user?.userId,
    userEmail: req.user?.email,
    role: req.user?.roleName,
  };

  if (!shouldSkipVerboseLog(req)) {
    httpLogger.debug('Incoming request', {
      ...requestMeta,
      sensitive: SENSITIVE_PATHS.some((route) => req.path.startsWith(route)),
    });
  }

  res.on('finish', () => {
    const durationMs = Date.now() - (req.startTime ?? Date.now());
    const statusCode = res.statusCode;
    const level = logLevelForStatus(statusCode);

    const responseMeta = {
      ...requestMeta,
      userId: req.user?.userId ?? requestMeta.userId,
      userEmail: req.user?.email ?? requestMeta.userEmail,
      role: req.user?.roleName ?? requestMeta.role,
      statusCode,
      durationMs,
      contentLength: res.getHeader('content-length') ?? 0,
    };

    if (shouldSkipVerboseLog(req)) {
      httpLogger.debug('Health check', responseMeta);
      return;
    }

    const message = `${req.method} ${req.originalUrl} ${statusCode} ${durationMs}ms`;

    httpLogger.log(level, message, responseMeta);
  });

  next();
}
