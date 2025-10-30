import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";

import type { LLMClientCallOptions } from "../ports/client";
import { LLMClientError } from "../ports/client";
import type {
  ChatMessage,
  EvaluateAnswerInput,
  GeneratePlanInput,
  InterviewRubricEvalInput,
} from "../types";

export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 3000;

export interface CompletionPrompts {
  systemPrompt: string;
  userPrompt: string;
}

export interface CompletionConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature: number;
  maxTokens?: number;
}

export function toChatCompletionMessage(message: ChatMessage): ChatCompletionMessageParam {
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

export function createGeneratePlanPrompt(input: GeneratePlanInput): CompletionPrompts {
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

export function createEvaluateAnswerPrompt(input: EvaluateAnswerInput): CompletionPrompts {
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

export function createInterviewRubricPrompt(input: InterviewRubricEvalInput): CompletionPrompts {
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

export function buildCompletionParams(
  prompts: CompletionPrompts,
  config: CompletionConfig,
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
