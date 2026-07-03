import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const durationPattern = /^\d+[smhd]$/;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .refine(
        (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
        'DATABASE_URL must be a PostgreSQL connection string'
      ),
    JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters'),
    JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
    JWT_ACCESS_EXPIRES_IN: z
      .string()
      .regex(durationPattern, 'JWT_ACCESS_EXPIRES_IN must be a duration like 15m or 1h'),
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(durationPattern, 'JWT_REFRESH_EXPIRES_IN must be a duration like 7d'),
    CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL'),
    UPLOAD_DIR: z.string().min(1).default('./uploads'),
    MAX_FILE_SIZE_MB: z.coerce.number().int().positive().max(1024).default(200),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_ACCESS_SECRET must be at least 32 characters in production',
          path: ['JWT_ACCESS_SECRET'],
        });
      }
      if (data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET must be at least 32 characters in production',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
    }
  });

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  const data = result.data;

  return {
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    databaseUrl: data.DATABASE_URL,
    corsOrigin: data.CORS_ORIGIN,
    jwt: {
      accessSecret: data.JWT_ACCESS_SECRET,
      refreshSecret: data.JWT_REFRESH_SECRET,
      accessExpiresIn: data.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: data.JWT_REFRESH_EXPIRES_IN,
    },
    upload: {
      dir: data.UPLOAD_DIR,
      maxFileSizeMb: data.MAX_FILE_SIZE_MB,
    },
    isProduction: data.NODE_ENV === 'production',
    isDevelopment: data.NODE_ENV === 'development',
    isTest: data.NODE_ENV === 'test',
  } as const;
}

export const env = parseEnv();

export type Env = typeof env;
