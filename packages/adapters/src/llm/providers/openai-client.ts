import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod";

import type { Logger } from "@english-app/observability";

import { type LLMClient, type LLMClientCallOptions, LLMClientError } from "../client";
import {
  type ChatMessage,
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

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 3000;

export interface OpenAiLLMClientConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  logger?: Logger;
}

interface CompletionParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature: number;
  maxTokens?: number;
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

function toChatCompletionMessage(message: ChatMessage): ChatCompletionMessageParam {
  const common = message.metadata ? { metadata: message.metadata } : {};

  switch (message.role) {
    case "system":
      return {
        role: "system",
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
        ...common,
      } satisfies ChatCompletionSystemMessageParam;
    case "user":
      return {
        role: "user",
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
        ...common,
      } satisfies ChatCompletionUserMessageParam;
    case "assistant":
      return {
        role: "assistant",
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
        ...common,
      } satisfies ChatCompletionAssistantMessageParam;
    case "tool": {
      const toolCallId =
        typeof message.metadata?.tool_call_id === "string"
          ? message.metadata.tool_call_id
          : undefined;

      if (!toolCallId) {
        throw new LLMClientError({
          message: "Tool messages require metadata.tool_call_id",
          code: "invalid_request",
        });
      }

      return {
        role: "tool",
        content: message.content,
        tool_call_id: toolCallId,
        ...common,
      } satisfies ChatCompletionToolMessageParam;
    }
    default: {
      const exhaustiveCheck: never = message.role;
      throw new LLMClientError({
        message: `Unsupported chat role: ${exhaustiveCheck}`,
        code: "invalid_request",
      });
    }
  }
}

function createGeneratePlanPrompt(input: GeneratePlanInput) {
  const systemPrompt =
    "You are an expert ESL curriculum designer creating interview-focused study plans for Brazilian software professionals. " +
    "Produce concise, actionable lesson plans that follow the provided JSON contract.";

  const userPrompt = [
    "Learner details:",
    JSON.stringify(
      {
        learner: input.learner,
        timeframeWeeks: input.timeframeWeeks,
        priorKnowledge: input.priorKnowledge,
        preferences: input.preferences,
        locale: input.locale ?? "pt-BR",
      },
      null,
      2,
    ),
    "Requirements:",
    "- Provide weekly objectives aligned with interview preparation.",
    "- Ensure lesson durations sum close to the learner's available time.",
    "- Tailor tone and recommendations considering locale and goals.",
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function createEvaluateAnswerPrompt(input: EvaluateAnswerInput) {
  const systemPrompt =
    "You are an experienced English interviewer assessing responses from Brazilian tech professionals. " +
    "Return structured feedback in JSON using CEFR-inspired grading.";

  const userPrompt = [
    "Question:",
    input.question,
    "",
    "Candidate answer:",
    input.answer,
    "",
    input.expectedAnswer ? `Reference answer:\n${input.expectedAnswer}\n` : "",
    "Evaluation criteria:",
    JSON.stringify(input.evaluationCriteria, null, 2),
    "",
    "Locale:",
    input.locale ?? "pt-BR",
  ]
    .filter(Boolean)
    .join("\n");

  return { systemPrompt, userPrompt };
}

function createInterviewRubricPrompt(input: InterviewRubricEvalInput) {
  const systemPrompt =
    "You are an interview coach scoring candidate transcripts against a rubric. " +
    "Provide evidence-based scoring and suggestions in JSON.";

  const userPrompt = [
    "Transcript:",
    input.transcript,
    "",
    "Rubric:",
    JSON.stringify(input.rubric, null, 2),
    "",
    "Context:",
    JSON.stringify(input.context ?? {}, null, 2),
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function buildCompletionParams(
  prompts: { systemPrompt: string; userPrompt: string },
  config: OpenAiLLMClientConfig,
  options?: LLMClientCallOptions,
): CompletionParams {
  const metadataTemperature = options?.metadata?.temperature;
  const parsedTemperature =
    typeof metadataTemperature === "string" ? Number.parseFloat(metadataTemperature) : undefined;

  const effectiveTemperature =
    Number.isFinite(parsedTemperature) && parsedTemperature !== undefined
      ? (parsedTemperature as number)
      : (config.temperature ?? DEFAULT_TEMPERATURE);

  return {
    model: config.model,
    temperature: effectiveTemperature,
    maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: prompts.userPrompt },
    ],
  };
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
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const logger = config.logger;

  return {
    async generatePlan(
      input: GeneratePlanInput,
      options?: LLMClientCallOptions,
    ): Promise<GeneratePlanResult> {
      const prompts = createGeneratePlanPrompt(input);
      const params = buildCompletionParams(prompts, config, options);
      return runJsonCompletion(openai, params, generatePlanSchema, "generatePlan", logger, options);
    },

    async evaluateAnswer(
      input: EvaluateAnswerInput,
      options?: LLMClientCallOptions,
    ): Promise<EvaluateAnswerResult> {
      const prompts = createEvaluateAnswerPrompt(input);
      const params = buildCompletionParams(prompts, config, options);
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
      const params = buildCompletionParams(prompts, config, options);
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
      const temperature = input.temperature ?? config.temperature ?? DEFAULT_TEMPERATURE;

      try {
        const response = await openai.chat.completions.create(
          {
            model: config.model,
            temperature,
            max_tokens: input.maxTokens ?? config.maxTokens ?? DEFAULT_MAX_TOKENS,
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
