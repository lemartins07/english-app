import type { Logger } from "@english-app/observability";

import type { ASRClient, ASRClientCallOptions } from "./client";
import { isASRClientError } from "./client";
import { ASRProviderError, type ASRProviderErrorCode } from "./errors";
import type { ASRProvider, ASRProviderCallOptions } from "./provider";
import type { ShortAudioFileRef, TranscribeShortAudioResult } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface ASRProviderAdapterLimits {
  maxDurationMs?: number;
  maxFileSizeBytes?: number;
}

export interface ASRProviderAdapterConfig {
  defaultTimeoutMs?: number;
  logger?: Logger;
  limits?: ASRProviderAdapterLimits;
}

type ASRClientMethod = keyof ASRClient;

export function createASRProviderAdapter(
  client: ASRClient,
  config: ASRProviderAdapterConfig = {},
): ASRProvider {
  const defaultTimeoutMs = config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logger = config.logger;
  const limits = config.limits;

  const invoke = async <Method extends ASRClientMethod>(
    methodName: Method,
    input: Parameters<ASRClient[Method]>[0],
    options?: ASRProviderCallOptions,
  ): Promise<Awaited<ReturnType<ASRClient[Method]>>> => {
    return callWithTimeout(
      {
        client,
        methodName,
        input,
        options,
        logger,
      },
      defaultTimeoutMs,
    );
  };

  return {
    async transcribeShortAudio(input, options) {
      enforceLimits(input.fileRef, limits, logger);
      const result = await invoke("transcribeShortAudio", input, options);
      validateTranscriptionResult(result, logger);
      return result;
    },
  };
}

interface CallContext<Method extends ASRClientMethod> {
  client: ASRClient;
  methodName: Method;
  input: Parameters<ASRClient[Method]>[0];
  options?: ASRProviderCallOptions;
  logger?: Logger;
}

async function callWithTimeout<Method extends ASRClientMethod>(
  context: CallContext<Method>,
  defaultTimeoutMs: number,
): Promise<Awaited<ReturnType<ASRClient[Method]>>> {
  const { client, methodName, input, options, logger } = context;
  const clientMethod = client[methodName].bind(client) as (
    input: Parameters<ASRClient[Method]>[0],
    options?: ASRClientCallOptions,
  ) => ReturnType<ASRClient[Method]>;

  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  const controller = new AbortController();
  const { signal } = controller;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let externallyAborted = false;
  let removeExternalAbortListener: (() => void) | undefined;

  if (options?.signal) {
    if (options.signal.aborted) {
      externallyAborted = true;
      controller.abort(options.signal.reason);
    } else {
      const forwardAbort = () => {
        externallyAborted = true;
        controller.abort(options.signal?.reason);
      };
      options.signal.addEventListener("abort", forwardAbort, { once: true });
      removeExternalAbortListener = () =>
        options.signal?.removeEventListener("abort", forwardAbort);
    }
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  try {
    return await clientMethod(input, {
      signal,
      metadata: options?.metadata,
    });
  } catch (error) {
    throw mapCallError(error, {
      timedOut,
      externallyAborted,
      methodName,
      logger,
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    removeExternalAbortListener?.();
  }
}

interface ErrorContext {
  timedOut: boolean;
  externallyAborted: boolean;
  methodName: ASRClientMethod;
  logger?: Logger;
}

function mapCallError(error: unknown, context: ErrorContext): ASRProviderError {
  if (error instanceof ASRProviderError) {
    return error;
  }

  if (context.timedOut) {
    context.logger?.warn?.("ASR provider call timed out", { method: context.methodName });
    return new ASRProviderError("ASR provider call timed out", {
      code: "TIMEOUT",
      cause: error,
    });
  }

  if (context.externallyAborted || isAbortError(error)) {
    context.logger?.info?.("ASR provider call was cancelled", { method: context.methodName });
    return new ASRProviderError("ASR provider call was cancelled", {
      code: "CANCELLED",
      cause: error,
    });
  }

  if (isASRClientError(error)) {
    const code = mapClientErrorToProviderCode(error);
    context.logger?.error?.("ASR provider call failed", {
      method: context.methodName,
      code,
      status: error.status,
      clientCode: error.code,
    });

    return new ASRProviderError(error.message, {
      code,
      cause: error,
      details: {
        status: error.status,
        clientCode: error.code,
        retryable: error.retryable,
        ...error.details,
      },
    });
  }

  context.logger?.error?.("Unexpected error from ASR provider", {
    method: context.methodName,
    error: error instanceof Error ? error.message : "unknown",
  });

  return new ASRProviderError("Unexpected error from ASR provider", {
    code: "UNKNOWN",
    cause: error,
  });
}

function mapClientErrorToProviderCode(error: {
  status?: number;
  code?: string;
}): ASRProviderErrorCode {
  if (error.code) {
    const normalized = error.code.toLowerCase();
    if (normalized.includes("rate") || normalized.includes("limit")) {
      return "TOO_MANY_REQUESTS";
    }
    if (normalized.includes("auth") || normalized.includes("unauthorized")) {
      return "UNAUTHORIZED";
    }
    if (normalized.includes("forbidden")) {
      return "FORBIDDEN";
    }
    if (normalized.includes("timeout")) {
      return "TIMEOUT";
    }
    if (normalized.includes("invalid_response")) {
      return "INVALID_RESPONSE";
    }
    if (normalized.includes("validation") || normalized.includes("invalid_request")) {
      return "BAD_REQUEST";
    }
  }

  const { status } = error;
  if (status === undefined) {
    return "UNKNOWN";
  }

  if (status === 401) {
    return "UNAUTHORIZED";
  }

  if (status === 403) {
    return "FORBIDDEN";
  }

  if (status === 408) {
    return "TIMEOUT";
  }

  if (status === 429) {
    return "TOO_MANY_REQUESTS";
  }

  if (status === 422 || status === 400 || status === 404) {
    return "BAD_REQUEST";
  }

  if (status >= 500 && status < 600) {
    return "SERVICE_UNAVAILABLE";
  }

  if (status >= 400 && status < 500) {
    return "BAD_REQUEST";
  }

  return "UNKNOWN";
}

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return (error as { name?: string }).name === "AbortError";
}

function enforceLimits(
  fileRef: ShortAudioFileRef,
  limits: ASRProviderAdapterLimits | undefined,
  logger?: Logger,
): void {
  if (!limits) {
    return;
  }

  if (limits.maxDurationMs !== undefined && fileRef.durationMs !== undefined) {
    if (fileRef.durationMs > limits.maxDurationMs) {
      logger?.warn?.("Audio duration is above configured limit", {
        durationMs: fileRef.durationMs,
        limitMs: limits.maxDurationMs,
      });
      throw new ASRProviderError("Audio duration exceeds supported limit", {
        code: "BAD_REQUEST",
        details: {
          durationMs: fileRef.durationMs,
          limitMs: limits.maxDurationMs,
        },
      });
    }
  }

  if (limits.maxFileSizeBytes !== undefined && fileRef.sizeBytes !== undefined) {
    if (fileRef.sizeBytes > limits.maxFileSizeBytes) {
      logger?.warn?.("Audio size is above configured limit", {
        sizeBytes: fileRef.sizeBytes,
        limitBytes: limits.maxFileSizeBytes,
      });
      throw new ASRProviderError("Audio size exceeds supported limit", {
        code: "BAD_REQUEST",
        details: {
          sizeBytes: fileRef.sizeBytes,
          limitBytes: limits.maxFileSizeBytes,
        },
      });
    }
  }
}

function validateTranscriptionResult(result: TranscribeShortAudioResult, logger?: Logger): void {
  const duration = result?.transcription?.durationMs;
  if (typeof duration !== "number" || Number.isNaN(duration)) {
    logger?.error?.("ASR provider returned invalid duration", {
      duration,
    });
    throw new ASRProviderError("ASR provider returned invalid duration", {
      code: "INVALID_RESPONSE",
      details: {
        duration,
      },
    });
  }
}
