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
    if (typeof value !== "string") {
      return false;
    }
    return value.trim().length > 0;
  });
}

export function clearLLMProviderCache() {
  cachedProvider = null;
}

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const { logger } = getObservabilityContext();
  const llmLogger = logger.child({ module: "llm.openai" });
  const env = getEnv();

  const missingEnvVars = REQUIRED_LLM_ENV.filter((key) => {
    const value = env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingEnvVars.length > 0) {
    const message = `Missing OpenAI configuration. Set the following environment variables before enabling AI features: ${missingEnvVars.join(
      ", ",
    )}.`;
    llmLogger.error(message, { missing: missingEnvVars });
    throw new Error(message);
  }

  const apiKey = env.OPENAI_API_KEY!.trim();
  const model = env.OPENAI_MODEL!.trim();
  const baseURL = env.OPENAI_BASE_URL?.trim() || undefined;

  const client = createOpenAiLLMClient({
    apiKey,
    baseURL,
    model,
    logger: llmLogger,
  });

  cachedProvider = createLLMProviderAdapter(client, {
    logger: llmLogger,
  });
  llmLogger.info("OpenAI provider initialized", {
    model,
    baseURL: baseURL ?? "https://api.openai.com/v1",
  });

  return cachedProvider;
}
