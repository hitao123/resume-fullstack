import type { ApiError } from '@/types/api.types';

export class ApiClientError extends Error implements ApiError {
  code?: string;
  errors?: Record<string, string[]>;
  details?: Record<string, unknown>;

  constructor(init: ApiError) {
    super(init.message);
    this.name = 'ApiClientError';
    this.code = init.code;
    this.errors = init.errors;
    this.details = init.details;
  }
}

export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code) return code;
  }
  return undefined;
}

export function isFormValidateError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'errorFields' in error;
}

export function toApiClientError(payload: Partial<ApiError> & { message?: string }): ApiClientError {
  return new ApiClientError({
    message: payload.message || 'An error occurred',
    code: payload.code,
    errors: payload.errors,
    details: payload.details,
  });
}
