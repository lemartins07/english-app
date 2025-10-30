import type { TranscribeShortAudioInput, TranscribeShortAudioResult } from "../types";

export interface ASRClientCallOptions {
  signal?: AbortSignal;
  metadata?: Record<string, string>;
}

export type ASRMethodMap = {
  transcribeShortAudio: {
    input: TranscribeShortAudioInput;
    result: TranscribeShortAudioResult;
  };
};

export type ASRMethod = keyof ASRMethodMap;

export type ASRArgs<M extends ASRMethod> = ASRMethodMap[M]["input"];

export type ASRResult<M extends ASRMethod> = ASRMethodMap[M]["result"];

export type ASRClient = {
  [M in ASRMethod]: (input: ASRArgs<M>, options?: ASRClientCallOptions) => Promise<ASRResult<M>>;
};

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
