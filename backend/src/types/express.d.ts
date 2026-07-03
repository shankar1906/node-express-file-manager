import type { JwtPayload } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId?: string;
      startTime?: number;
    }

    interface Locals {
      validatedQuery?: unknown;
    }
  }
}

export {};
