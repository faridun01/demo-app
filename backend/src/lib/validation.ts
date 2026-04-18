import { ZodError, type ZodType } from 'zod';
import { AppError } from './http.js';

export const parseSchema = <T>(schema: ZodType<T>, input: unknown): T => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Validation failed', {
        status: 400,
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      });
    }

    throw error;
  }
};

export const trimToNull = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};
