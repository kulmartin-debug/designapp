export type ErrorCode =
  | 'ERR_TIMEOUT'
  | 'ERR_RATE_LIMITED'
  | 'ERR_INVALID_INPUT'
  | 'ERR_PROVIDER_ERROR'
  | 'ERR_UNSUPPORTED_PROVIDER_FOR_MODULE'
  | 'ERR_FILE_TOO_LARGE'
  | 'ERR_INVALID_MIME_TYPE'
  | 'ERR_NOT_FOUND'
  | 'ERR_CONFLICT'
  | 'ERR_UNAUTHORIZED'
  | 'ERR_INTERNAL';

// HTTP-facing error. `message` is English/dev-facing; the frontend maps
// `code` to a Slovak string via i18n/sk.ts so wire format and copy stay decoupled.
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static notFound(message = 'Resource not found') {
    return new ApiError('ERR_NOT_FOUND', message, 404);
  }

  static invalidInput(message = 'Invalid input') {
    return new ApiError('ERR_INVALID_INPUT', message, 400);
  }

  static conflict(message = 'Conflict') {
    return new ApiError('ERR_CONFLICT', message, 409);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError('ERR_UNAUTHORIZED', message, 401);
  }

  static internal(message = 'Internal error') {
    return new ApiError('ERR_INTERNAL', message, 500);
  }
}

// Errors raised by AI provider adapters (network/model layer). Classified so
// the job runner's withRetry() knows which codes are worth retrying.
export type ProviderErrorCode =
  | 'ERR_TIMEOUT'
  | 'ERR_RATE_LIMITED'
  | 'ERR_INVALID_INPUT'
  | 'ERR_PROVIDER_ERROR'
  | 'ERR_UNSUPPORTED_PROVIDER_FOR_MODULE'
  | 'ERR_INTERNAL';

export class ProviderCallError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderCallError';
  }
}
