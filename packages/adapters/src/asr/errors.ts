export type ASRProviderErrorCode =
  | "TIMEOUT"
  | "CANCELLED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "UNKNOWN";

export interface ASRProviderErrorParams {
  code: ASRProviderErrorCode;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class ASRProviderError extends Error {
  readonly code: ASRProviderErrorCode;
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;

  constructor(message: string, params: ASRProviderErrorParams) {
    super(message);
    this.name = "ASRProviderError";
    this.code = params.code;
    this.cause = params.cause;
    this.details = params.details;
  }
}

export function isASRProviderError(error: unknown): error is ASRProviderError {
  return error instanceof ASRProviderError;
}
