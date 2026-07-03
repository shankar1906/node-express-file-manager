import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../utils/env';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const devConsoleFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaKeys = Object.keys(meta).filter((key) => key !== 'module' && key !== 'service');
  const metaString =
    metaKeys.length > 0
      ? ` ${JSON.stringify(
          Object.fromEntries(metaKeys.map((key) => [key, meta[key]])),
          null,
          0
        )}`
      : '';

  const module = meta.module ? `[${meta.module}] ` : '';
  return `${ts} ${level}: ${module}${message}${metaString}`;
});

const baseFormat = combine(timestamp(), errors({ stack: true }));

export const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'fms-backend' },
  format: combine(baseFormat, json()),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devConsoleFormat),
    })
  );
}

export const httpLogger = logger.child({ module: 'http' });
export const authLogger = logger.child({ module: 'auth' });
export const fileLogger = logger.child({ module: 'file' });
export const appLogger = logger.child({ module: 'app' });
export const errorLogger = logger.child({ module: 'error' });

export function logLevelForStatus(statusCode: number): 'error' | 'warn' | 'info' | 'debug' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  if (statusCode >= 200) return 'info';
  return 'debug';
}
