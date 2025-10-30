import type { TranscribeShortAudioInput, TranscribeShortAudioResult } from "../types";

export interface ASRClientCallOptions {
  signal?: AbortSignal;
  metadata?: Record<string, string>;
}

export interface ASRClient {
  transcribeShortAudio(
    input: TranscribeShortAudioInput,
    options?: ASRClientCallOptions,
  ): Promise<TranscribeShortAudioResult>;
}

export interface ASRClientErrorParams {
  message: string;
  status?: number;
  code?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class ASRClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryable?: boolean;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(params: ASRClientErrorParams) {
    super(params.message);
    this.name = "ASRClientError";
    this.status = params.status;
    this.code = params.code;
    this.retryable = params.retryable;
    this.details = params.details;
    this.cause = params.cause;
  }
}

export function isASRClientError(error: unknown): error is ASRClientError {
  return error instanceof ASRClientError;
}
