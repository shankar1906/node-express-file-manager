import { z } from 'zod';

const uuidSchema = z.string().uuid();

export function isValidUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}

export function generateCustomId(prefix: string, sno: number, padLength = 5): string {
  return `${prefix}-${String(sno).padStart(padLength, '0')}`;
}