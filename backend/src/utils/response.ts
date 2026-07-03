import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  res.status(status).json(body);
}

export function sendError(res: Response, message: string, status = 400, errors?: unknown): void {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
}
