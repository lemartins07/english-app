import {
  createLLMProviderAdapter,
  createOpenAiLLMClient,
  type LLMProvider,
} from "@english-app/adapters";
import { getObservabilityContext } from "@english-app/observability";

import { getEnv } from "../env";

const REQUIRED_LLM_ENV = ["OPENAI_API_KEY", "OPENAI_MODEL"] as const;

let cachedProvider: LLMProvider | null = null;

export function hasLLMEnvironment(): boolean {
  return REQUIRED_LLM_ENV.every((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.length > 0;
  });
}

export function clearLLMProviderCache() {
  cachedProvider = null;
}

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const env = getEnv();

  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
    throw new Error("OpenAI configuration is missing. Set OPENAI_API_KEY and OPENAI_MODEL.");
  }

  const { logger } = getObservabilityContext();
  const llmLogger = logger.child({ module: "llm.openai" });

  const client = createOpenAiLLMClient({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
    model: env.OPENAI_MODEL,
    logger: llmLogger,
  });

  cachedProvider = createLLMProviderAdapter(client, {
    logger: llmLogger,
  });

  return cachedProvider;
}
