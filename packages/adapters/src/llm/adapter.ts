import { createRemoteCallExecutor } from "@english-app/application/services/remote-call";
import type { Logger } from "@english-app/observability";

import type { LLMClient, LLMClientCallOptions, LLMClientError } from "./client";
import { isLLMClientError } from "./client";
import { LLMProviderError, type LLMProviderErrorCode } from "./errors";
import type { LLMProvider, LLMProviderCallOptions } from "./provider";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface LLMProviderAdapterConfig {
  defaultTimeoutMs?: number;
  logger?: Logger;
}

type LLMClientMethod = keyof LLMClient;

const remoteCall = createRemoteCallExecutor<
  LLMProviderError,
  LLMProviderErrorCode,
  LLMClientError,
  LLMProviderCallOptions
>({
  serviceName: "LLM provider",
  createProviderError: (message, params) => new LLMProviderError(message, params),
  isProviderError: (error): error is LLMProviderError => error instanceof LLMProviderError,
  isClientError: isLLMClientError,
});

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
    const clientMethod = client[methodName].bind(client) as (
      input: Parameters<LLMClient[Method]>[0],
      options?: LLMClientCallOptions,
    ) => ReturnType<LLMClient[Method]>;

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
    generatePlan: (input, options) => invoke("generatePlan", input, options),
    evaluateAnswer: (input, options) => invoke("evaluateAnswer", input, options),
    interviewRubricEval: (input, options) => invoke("interviewRubricEval", input, options),
    chatReply: (input, options) => invoke("chatReply", input, options),
  };
}
