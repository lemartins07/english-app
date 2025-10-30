import { createRemoteCallExecutor } from "@english-app/application/services/remote-call";
import type { Logger } from "@english-app/observability";

import { ASRProviderError, type ASRProviderErrorCode } from "../errors";
import type { ASRClient, ASRClientCallOptions, ASRClientError } from "../ports/client";
import { isASRClientError } from "../ports/client";
import type { ASRProvider, ASRProviderCallOptions } from "../ports/provider";
import type { ShortAudioFileRef, TranscribeShortAudioResult } from "../types";

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

const remoteCall = createRemoteCallExecutor<
  ASRProviderError,
  ASRProviderErrorCode,
  ASRClientError,
  ASRProviderCallOptions
>({
  serviceName: "ASR provider",
  createProviderError: (message, params) => new ASRProviderError(message, params),
  isProviderError: (error): error is ASRProviderError => error instanceof ASRProviderError,
  isClientError: isASRClientError,
});

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
    const clientMethod = client[methodName].bind(client) as (
      input: Parameters<ASRClient[Method]>[0],
      options?: ASRClientCallOptions,
    ) => ReturnType<ASRClient[Method]>;

    return remoteCall.execute({
      methodName: String(methodName),
      defaultTimeoutMs,
      options,
      logger,
      perform: ({ signal }) =>
        clientMethod(input, {
          signal,
          metadata: options?.metadata,
        }),
    });
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
