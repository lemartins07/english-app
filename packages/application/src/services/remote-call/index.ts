import type { Logger } from "@english-app/observability";

export interface RemoteCallOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  metadata?: Record<string, string>;
}

export interface RemoteCallClientErrorLike {
  status?: number;
  code?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export type RemoteCallStandardErrorCode =
  | "TIMEOUT"
  | "CANCELLED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "UNKNOWN";

export interface RemoteCallExecutorConfig<
  ProviderError extends Error,
  ProviderErrorCode extends RemoteCallStandardErrorCode,
  ClientError extends RemoteCallClientErrorLike,
> {
  serviceName: string;
  createProviderError: (
    message: string,
    params: {
      code: ProviderErrorCode;
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) => ProviderError;
  isProviderError: (error: unknown) => error is ProviderError;
  isClientError: (error: unknown) => error is ClientError;
  mapClientErrorToCode?: (error: ClientError) => ProviderErrorCode;
  getClientErrorDetails?: (error: ClientError) => Record<string, unknown>;
}

export interface RemoteCallExecutionContext<ProviderOptions extends RemoteCallOptions> {
  signal: AbortSignal;
  options?: ProviderOptions;
}

export interface ExecuteRemoteCallParams<Result, ProviderOptions extends RemoteCallOptions> {
  methodName: string;
  defaultTimeoutMs: number;
  options?: ProviderOptions;
  logger?: Logger;
  perform: (context: RemoteCallExecutionContext<ProviderOptions>) => Promise<Result>;
}

interface RemoteCallErrorContext {
  timedOut: boolean;
  externallyAborted: boolean;
  methodName: string;
  logger?: Logger;
}

export function createRemoteCallExecutor<
  ProviderError extends Error,
  ProviderErrorCode extends RemoteCallStandardErrorCode,
  ClientError extends RemoteCallClientErrorLike,
  ProviderOptions extends RemoteCallOptions = RemoteCallOptions,
>(config: RemoteCallExecutorConfig<ProviderError, ProviderErrorCode, ClientError>) {
  const mapClientErrorToCode =
    config.mapClientErrorToCode ?? mapStandardClientErrorToCode<ProviderErrorCode>;
  const getClientErrorDetails = config.getClientErrorDetails ?? defaultGetClientErrorDetails;

  const translateError = (error: unknown, context: RemoteCallErrorContext): ProviderError => {
    if (config.isProviderError(error)) {
      return error;
    }

    if (context.timedOut) {
      context.logger?.warn?.(`${config.serviceName} call timed out`, {
        method: context.methodName,
      });
      return config.createProviderError(`${config.serviceName} call timed out`, {
        code: "TIMEOUT" as ProviderErrorCode,
        cause: error,
      });
    }

    if (context.externallyAborted || isAbortError(error)) {
      context.logger?.info?.(`${config.serviceName} call was cancelled`, {
        method: context.methodName,
      });
      return config.createProviderError(`${config.serviceName} call was cancelled`, {
        code: "CANCELLED" as ProviderErrorCode,
        cause: error,
      });
    }

    if (config.isClientError(error)) {
      const code = mapClientErrorToCode(error);
      const details = getClientErrorDetails(error);

      context.logger?.error?.(`${config.serviceName} call failed`, {
        method: context.methodName,
        code,
        ...details,
      });

      return config.createProviderError(error.message, {
        code,
        cause: error,
        details,
      });
    }

    context.logger?.error?.(`Unexpected error from ${config.serviceName}`, {
      method: context.methodName,
      error: error instanceof Error ? error.message : "unknown",
    });

    return config.createProviderError(`Unexpected error from ${config.serviceName}`, {
      code: "UNKNOWN" as ProviderErrorCode,
      cause: error,
    });
  };

  async function execute<Result>(
    params: ExecuteRemoteCallParams<Result, ProviderOptions>,
  ): Promise<Result> {
    const { methodName, options, defaultTimeoutMs, logger, perform } = params;
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
      return await perform({ signal, options });
    } catch (error) {
      throw translateError(error, {
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

  return { execute };
}

function mapStandardClientErrorToCode<ProviderErrorCode extends RemoteCallStandardErrorCode>(
  error: RemoteCallClientErrorLike,
): ProviderErrorCode {
  if (error.code) {
    const normalized = error.code.toLowerCase();
    if (normalized.includes("rate") || normalized.includes("limit")) {
      return "TOO_MANY_REQUESTS" as ProviderErrorCode;
    }
    if (normalized.includes("auth") || normalized.includes("unauthorized")) {
      return "UNAUTHORIZED" as ProviderErrorCode;
    }
    if (normalized.includes("forbidden")) {
      return "FORBIDDEN" as ProviderErrorCode;
    }
    if (normalized.includes("timeout")) {
      return "TIMEOUT" as ProviderErrorCode;
    }
    if (normalized.includes("invalid_response")) {
      return "INVALID_RESPONSE" as ProviderErrorCode;
    }
    if (normalized.includes("validation") || normalized.includes("invalid_request")) {
      return "BAD_REQUEST" as ProviderErrorCode;
    }
  }

  const { status } = error;
  if (status === undefined) {
    return "UNKNOWN" as ProviderErrorCode;
  }

  if (status === 401) {
    return "UNAUTHORIZED" as ProviderErrorCode;
  }

  if (status === 403) {
    return "FORBIDDEN" as ProviderErrorCode;
  }

  if (status === 408) {
    return "TIMEOUT" as ProviderErrorCode;
  }

  if (status === 429) {
    return "TOO_MANY_REQUESTS" as ProviderErrorCode;
  }

  if (status === 422 || status === 400 || status === 404) {
    return "BAD_REQUEST" as ProviderErrorCode;
  }

  if (status >= 500 && status < 600) {
    return "SERVICE_UNAVAILABLE" as ProviderErrorCode;
  }

  if (status >= 400 && status < 500) {
    return "BAD_REQUEST" as ProviderErrorCode;
  }

  return "UNKNOWN" as ProviderErrorCode;
}

function defaultGetClientErrorDetails(error: RemoteCallClientErrorLike) {
  return {
    status: error.status,
    clientCode: error.code,
    retryable: error.retryable,
    ...(error.details ?? {}),
  };
}

export function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return (error as { name?: string }).name === "AbortError";
}
