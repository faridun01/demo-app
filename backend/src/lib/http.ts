import type { Response } from 'express';

export class AppError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.status = options?.status ?? 500;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export const ok = <T>(res: Response, data: T) => res.json(data);

export const created = <T>(res: Response, data: T) => res.status(201).json(data);

export const parseNumericId = (value: unknown, label = 'ID') => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${label} is invalid`, { status: 400, code: 'INVALID_ID' });
  }

  return parsed;
};

export const toErrorPayload = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Something went wrong!';
  const maybeStatus = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: unknown }).status) : NaN;
  const status = Number.isFinite(maybeStatus) ? maybeStatus : 500;
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code || '') : undefined;
  const details = typeof error === 'object' && error && 'details' in error ? (error as { details?: unknown }).details : undefined;

  return {
    status,
    body: {
      error: fallbackMessage,
      code: code || undefined,
      details,
    },
  };
};
