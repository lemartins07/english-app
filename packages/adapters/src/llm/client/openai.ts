import OpenAI from "openai";
import { z } from "zod";

import type { Logger } from "@english-app/observability";

import {
  buildCompletionParams,
  type CompletionConfig,
  type CompletionParams,
  createEvaluateAnswerPrompt,
  createGeneratePlanPrompt,
  createInterviewRubricPrompt,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  toChatCompletionMessage,
} from "../mappers/openai";
import type { LLMClient, LLMClientCallOptions } from "../ports/client";
import { LLMClientError } from "../ports/client";
import {
  type ChatReply,
  type ChatReplyInput,
  type EvaluateAnswerInput,
  type EvaluateAnswerResult,
  type GeneratePlanInput,
  type GeneratePlanResult,
  type InterviewRubricEvalInput,
  type InterviewRubricEvalResult,
} from "../types";

const generatePlanSchema = z.object({
  overview: z.string(),
  rationale: z.string(),
  metrics: z.object({
    totalMinutes: z.number(),
    estimatedCompletionWeeks: z.number(),
  }),
  weeks: z
    .array(
      z.object({
        week: z.number().int(),
        theme: z.string(),
        objectives: z.array(z.string()),
        lessons: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            objective: z.string(),
            summary: z.string(),
            activities: z.array(
              z.object({
                type: z.string(),
                description: z.string(),
                durationMinutes: z.number(),
                resources: z.array(z.string()).optional(),
              }),
            ),
            homework: z.string().optional(),
          }),
        ),
      }),
    )
    .min(1),
  recommendations: z.array(z.string()).optional(),
});

const evaluateAnswerSchema = z.object({
  overallScore: z.number(),
  grade: z.string().optional(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  issues: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
});

const interviewRubricEvalSchema = z.object({
  overallScore: z.number(),
  summary: z.string(),
  criteria: z.array(
    z.object({
      criterionId: z.string(),
      score: z.number(),
      evidence: z.string(),
      notes: z.string().optional(),
      actionItems: z.array(z.string()).optional(),
    }),
  ),
});

export interface OpenAiLLMClientConfig extends CompletionConfig {
  apiKey: string;
  baseURL?: string;
  logger?: Logger;
}

function parseJsonResponse<T>(
  rawContent: string | null | undefined,
  schema: z.ZodSchema<T>,
  context: string,
  logger?: Logger,
): T {
  if (!rawContent) {
    logger?.error("OpenAI response was empty", { context });
    throw new LLMClientError({
      message: "Received empty response from OpenAI",
      code: "invalid_response",
    });
  }

  try {
    const parsed = JSON.parse(rawContent);
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      logger?.error("OpenAI response failed validation", {
        context,
        issues: validation.error.issues,
      });
      throw new LLMClientError({
        message: "OpenAI response did not match expected schema",
        code: "invalid_response",
        details: { issues: validation.error.issues },
      });
    }

    return validation.data;
  } catch (error) {
    if (error instanceof LLMClientError) {
      throw error;
    }

    logger?.error("Failed to parse OpenAI response as JSON", {
      context,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new LLMClientError({
      message: "Unable to parse OpenAI response as JSON",
      code: "invalid_response",
      cause: error,
    });
  }
}

function handleOpenAiError(error: unknown, context: string, logger?: Logger): never {
  if (error instanceof OpenAI.APIError) {
    const param = (error as { param?: string }).param;
    const requestId = (error as { headers?: Headers }).headers?.get?.("x-request-id");
    const code = typeof error.code === "string" ? error.code : undefined;

    logger?.error("OpenAI API error", {
      context,
      status: error.status,
      code,
      type: error.type,
      requestId,
    });

    throw new LLMClientError({
      message: error.message,
      status: error.status,
      code: code ?? error.type ?? "openai_api_error",
      retryable: typeof error.status === "number" ? error.status >= 500 : undefined,
      details: {
        type: error.type,
        param,
        requestId: requestId ?? undefined,
      },
      cause: error,
    });
  }

  if (error instanceof Error && error.name === "AbortError") {
    throw error;
  }

  logger?.error("Unexpected error while calling OpenAI", {
    context,
    error: error instanceof Error ? error.message : "unknown",
  });

  throw new LLMClientError({
    message: "Unexpected error while calling OpenAI",
    code: "unknown_error",
    cause: error,
  });
}

async function runJsonCompletion<T>(
  client: OpenAI,
  params: CompletionParams,
  schema: z.ZodSchema<T>,
  context: string,
  logger: Logger | undefined,
  options?: LLMClientCallOptions,
): Promise<T> {
  try {
    const response = await client.chat.completions.create(
      {
        model: params.model,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        response_format: { type: "json_object" },
        messages: params.messages,
      },
      {
        signal: options?.signal,
      },
    );

    const rawContent = response.choices[0]?.message?.content;
    return parseJsonResponse(rawContent, schema, context, logger);
  } catch (error) {
    handleOpenAiError(error, context, logger);
  }
}

export function createOpenAiLLMClient(config: OpenAiLLMClientConfig): LLMClient {
  const missing: string[] = [];

  const apiKey = config.apiKey.trim();
  if (apiKey.length === 0) {
    missing.push("OPENAI_API_KEY");
  }

  const model = config.model.trim();
  if (model.length === 0) {
    missing.push("OPENAI_MODEL");
  }

  const baseURL = config.baseURL?.trim() || undefined;
  const sanitizedConfig: OpenAiLLMClientConfig = {
    ...config,
    apiKey,
    model,
    baseURL,
  };
  const logger = sanitizedConfig.logger;

  if (missing.length > 0) {
    const message = `OpenAI client misconfigured. Set the following environment variables before enabling AI features: ${missing.join(
      ", ",
    )}.`;
    logger?.error?.(message, { missing });
    throw new LLMClientError({
      message,
      code: "invalid_configuration",
    });
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  return {
    async generatePlan(
      input: GeneratePlanInput,
      options?: LLMClientCallOptions,
    ): Promise<GeneratePlanResult> {
      const prompts = createGeneratePlanPrompt(input);
      const params = buildCompletionParams(prompts, sanitizedConfig, options);
      return runJsonCompletion(openai, params, generatePlanSchema, "generatePlan", logger, options);
    },

    async evaluateAnswer(
      input: EvaluateAnswerInput,
      options?: LLMClientCallOptions,
    ): Promise<EvaluateAnswerResult> {
      const prompts = createEvaluateAnswerPrompt(input);
      const params = buildCompletionParams(prompts, sanitizedConfig, options);
      return runJsonCompletion(
        openai,
        params,
        evaluateAnswerSchema,
        "evaluateAnswer",
        logger,
        options,
      );
    },

    async interviewRubricEval(
      input: InterviewRubricEvalInput,
      options?: LLMClientCallOptions,
    ): Promise<InterviewRubricEvalResult> {
      const prompts = createInterviewRubricPrompt(input);
      const params = buildCompletionParams(prompts, sanitizedConfig, options);
      return runJsonCompletion(
        openai,
        params,
        interviewRubricEvalSchema,
        "interviewRubricEval",
        logger,
        options,
      );
    },

    async chatReply(input: ChatReplyInput, options?: LLMClientCallOptions): Promise<ChatReply> {
      const temperature = input.temperature ?? sanitizedConfig.temperature ?? DEFAULT_TEMPERATURE;

      try {
        const response = await openai.chat.completions.create(
          {
            model: sanitizedConfig.model,
            temperature,
            max_tokens: input.maxTokens ?? sanitizedConfig.maxTokens ?? DEFAULT_MAX_TOKENS,
            messages: input.messages.map((message) => toChatCompletionMessage(message)),
          },
          {
            signal: options?.signal,
          },
        );

        const choice = response.choices[0];
        const content = choice?.message?.content ?? "";

        return {
          message: {
            role: "assistant",
            content,
          },
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens ?? 0,
                completionTokens: response.usage.completion_tokens ?? 0,
                totalTokens: response.usage.total_tokens ?? 0,
              }
            : undefined,
        };
      } catch (error) {
        handleOpenAiError(error, "chatReply", logger);
      }
    },
  };
}
