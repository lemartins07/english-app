import { createRemoteCallExecutor } from "@english-app/application/services/remote-call";
import type { Logger } from "@english-app/observability";

import { LLMProviderError, type LLMProviderErrorCode } from "../errors";
import type { LLMArgs, LLMClient, LLMClientError, LLMMethod, LLMResult } from "../ports/client";
import { isLLMClientError } from "../ports/client";
import type { LLMProvider, LLMProviderCallOptions } from "../ports/provider";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface LLMProviderAdapterConfig {
  defaultTimeoutMs?: number;
  logger?: Logger;
}

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

  const invoke = async <Method extends LLMMethod>(
    methodName: Method,
    input: LLMArgs<Method>,
    options?: LLMProviderCallOptions,
  ): Promise<LLMResult<Method>> => {
    return remoteCall.execute({
      methodName: String(methodName),
      defaultTimeoutMs,
      options,
      logger,
      perform: ({ signal }) =>
        client[methodName](input, {
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
