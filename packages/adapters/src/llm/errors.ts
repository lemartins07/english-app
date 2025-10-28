export type LLMProviderErrorCode =
  | "TIMEOUT"
  | "CANCELLED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "UNKNOWN";

export interface LLMProviderErrorParams {
  code: LLMProviderErrorCode;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class LLMProviderError extends Error {
  readonly code: LLMProviderErrorCode;
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;

  constructor(message: string, params: LLMProviderErrorParams) {
    super(message);
    this.name = "LLMProviderError";
    this.code = params.code;
    this.cause = params.cause;
    this.details = params.details;
  }
}

export function isLLMProviderError(error: unknown): error is LLMProviderError {
  return error instanceof LLMProviderError;
}
