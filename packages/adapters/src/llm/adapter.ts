import type { Logger } from "@english-app/observability";

import type { LLMClient, LLMClientCallOptions } from "./client";
import { isLLMClientError } from "./client";
import { LLMProviderError, type LLMProviderErrorCode } from "./errors";
import type { LLMProvider, LLMProviderCallOptions } from "./provider";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface LLMProviderAdapterConfig {
  defaultTimeoutMs?: number;
  logger?: Logger;
}

type LLMClientMethod = keyof LLMClient;

export function createLLMProviderAdapter(
  client: LLMClient,
  config: LLMProviderAdapterConfig = {},
): LLMProvider {
  const defaultTimeoutMs = config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logger = config.logger;

  const invoke = async <Method extends LLMClientMethod>(
    methodName: Method,
    input: Parameters<LLMClient[Method]>[0],
    options?: LLMProviderCallOptions,
  ): Promise<Awaited<ReturnType<LLMClient[Method]>>> => {
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
    generatePlan: (input, options) => invoke("generatePlan", input, options),
    evaluateAnswer: (input, options) => invoke("evaluateAnswer", input, options),
    interviewRubricEval: (input, options) => invoke("interviewRubricEval", input, options),
    chatReply: (input, options) => invoke("chatReply", input, options),
  };
}

interface CallContext<Method extends LLMClientMethod> {
  client: LLMClient;
  methodName: Method;
  input: Parameters<LLMClient[Method]>[0];
  options?: LLMProviderCallOptions;
  logger?: Logger;
}

async function callWithTimeout<Method extends LLMClientMethod>(
  context: CallContext<Method>,
  defaultTimeoutMs: number,
): Promise<Awaited<ReturnType<LLMClient[Method]>>> {
  const { client, methodName, input, options, logger } = context;
  const clientMethod = client[methodName].bind(client) as (
    input: Parameters<LLMClient[Method]>[0],
    options?: LLMClientCallOptions,
  ) => ReturnType<LLMClient[Method]>;

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
    const result = await clientMethod(input, {
      signal,
      metadata: options?.metadata,
    });
    return result;
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
  methodName: LLMClientMethod;
  logger?: Logger;
}

function mapCallError(error: unknown, context: ErrorContext): LLMProviderError {
  if (error instanceof LLMProviderError) {
    return error;
  }

  if (context.timedOut) {
    context.logger?.warn?.("LLM provider call timed out", { method: context.methodName });
    return new LLMProviderError("LLM provider call timed out", {
      code: "TIMEOUT",
      cause: error,
    });
  }

  if (context.externallyAborted || isAbortError(error)) {
    context.logger?.info?.("LLM provider call was cancelled", { method: context.methodName });
    return new LLMProviderError("LLM provider call was cancelled", {
      code: "CANCELLED",
      cause: error,
    });
  }

  if (isLLMClientError(error)) {
    const code = mapClientErrorToProviderCode(error);
    context.logger?.error?.("LLM provider call failed", {
      method: context.methodName,
      code,
      status: error.status,
      clientCode: error.code,
    });

    return new LLMProviderError(error.message, {
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

  context.logger?.error?.("Unexpected error from LLM provider", {
    method: context.methodName,
    error: error instanceof Error ? error.message : "unknown",
  });

  return new LLMProviderError("Unexpected error from LLM provider", {
    code: "UNKNOWN",
    cause: error,
  });
}

function mapClientErrorToProviderCode(error: {
  status?: number;
  code?: string;
}): LLMProviderErrorCode {
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
