import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
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
    totalMinutes: z.coerce.number(),
    estimatedCompletionWeeks: z.coerce.number(),
  }),
  weeks: z
    .array(
      z.object({
        week: z.coerce.number().int(),
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
                durationMinutes: z.coerce.number(),
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
  overallScore: z.coerce.number(),
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
  overallScore: z.coerce.number(),
  summary: z.string(),
  criteria: z.array(
    z.object({
      criterionId: z.string(),
      score: z.coerce.number(),
      evidence: z.string(),
      notes: z.string().optional(),
      actionItems: z.array(z.string()).optional(),
    }),
  ),
});

const DEFAULT_EMPTY_RESPONSE_RETRIES = 2;
const MAX_EMPTY_RESPONSE_RETRIES = 5;

const INTERVIEW_RUBRIC_JSON_SCHEMA: NonNullable<CompletionParams["responseSchema"]> = {
  name: "InterviewRubricEvaluation",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "summary", "criteria"],
    properties: {
      overallScore: {
        type: "number",
        minimum: 0,
        maximum: 100,
      },
      summary: {
        type: "string",
      },
      criteria: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["criterionId", "score", "evidence"],
          properties: {
            criterionId: {
              type: "string",
            },
            score: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            evidence: {
              type: "string",
            },
            notes: {
              type: "string",
            },
            actionItems: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
  } satisfies Record<string, unknown>,
};

export interface OpenAiLLMClientConfig extends CompletionConfig {
  apiKey: string;
  baseURL?: string;
  logger?: Logger;
}

interface ParseJsonResponseParams<T> {
  rawContent: string | null | undefined;
  schema: z.ZodSchema<T>;
  context: string;
  logger?: Logger;
  transform?: (data: unknown) => unknown;
}

function parseJsonResponse<T>({
  rawContent,
  schema,
  context,
  logger,
  transform,
}: ParseJsonResponseParams<T>): T {
  if (!rawContent) {
    logger?.error("OpenAI response was empty", { context });
    throw new LLMClientError({
      message: "Received empty response from OpenAI",
      code: "invalid_response",
    });
  }

  try {
    const normalizedContent = normalizeJsonLikeContent(rawContent);
    const parsed = JSON.parse(normalizedContent);
    const normalized = normalizeParsedPayload(parsed);
    const processed = transform ? transform(normalized) : normalized;
    const validation = schema.safeParse(processed);
    if (!validation.success) {
      logger?.error("OpenAI response failed validation", {
        context,
        issues: validation.error.issues,
        raw: truncateForLog(normalizedContent),
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
      raw: truncateForLog(rawContent),
    });
    throw new LLMClientError({
      message: "Unable to parse OpenAI response as JSON",
      code: "invalid_response",
      cause: error,
    });
  }
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function normalizeJsonLikeContent(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch?.[1]) {
      return fenceMatch[1].trim();
    }
  }

  // Some models wrap the JSON in leading/trailing text. Attempt to extract first JSON object.
  const firstBraceIndex = trimmed.indexOf("{");
  const lastBraceIndex = trimmed.lastIndexOf("}");
  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    const candidate = trimmed.slice(firstBraceIndex, lastBraceIndex + 1).trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // Fall through to original trimmed content if parsing fails.
    }
  }

  return trimmed;
}

function normalizeParsedPayload(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeParsedPayload(item)).filter(isDefined);
  }

  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, itemValue]) => {
        const normalizedValue = normalizeParsedPayload(itemValue);
        if (normalizedValue === undefined) {
          return accumulator;
        }
        const normalizedKey = toCamelCaseKey(key);
        accumulator[normalizedKey] = normalizedValue;
        return accumulator;
      },
      {},
    );
  }

  return value;
}

function transformInterviewRubricEvalResponse(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const payload = data as Record<string, unknown>;

  if (payload.criterion) {
    return transformCriterionCentricRubric(payload);
  }

  if (payload.scoreReport ?? payload.score_report) {
    return transformScoreReportRubric(payload);
  }

  const rubricAssessmentRaw = Array.isArray(payload.rubricAssessment)
    ? payload.rubricAssessment
    : undefined;

  if (!rubricAssessmentRaw) {
    return data;
  }

  const overall = (payload.overall as Record<string, unknown> | undefined) ?? {};
  const candidate = (payload.candidate as Record<string, unknown> | undefined) ?? {};

  const outOf = toNumber(overall.outOf) ?? 100;
  const weightedScore = toNumber(overall.weightedScore);
  const rawScore = toNumber(overall.rawScore);
  const overallScore = normalizeScoreToPercentage(weightedScore ?? rawScore, outOf);

  const levelSummaries = rubricAssessmentRaw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return undefined;
      }
      const item = entry as Record<string, unknown>;
      const title = toNonEmptyString(item.title) ?? toNonEmptyString(item.id);
      const level = toNonEmptyString(item.level);
      if (!title || !level) {
        return undefined;
      }
      return `${title}: ${level}`;
    })
    .filter(isDefined);

  const candidateName = toNonEmptyString(candidate.name);
  const candidateNotes = toNonEmptyString(candidate.notes);
  const summaryParts: string[] = [];

  if (candidateName) {
    summaryParts.push(ensureSentence(`Candidate ${candidateName}`));
  }

  summaryParts.push(ensureSentence(`Overall score ${formatScore(overallScore)} / 100`));

  if (levelSummaries.length > 0) {
    summaryParts.push(ensureSentence(`Levels: ${levelSummaries.join(", ")}`));
  }

  if (candidateNotes) {
    summaryParts.push(ensureSentence(candidateNotes));
  }

  const summary = summaryParts.join(" ").trim() || "LLM evaluation completed.";

  const criteria = rubricAssessmentRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return undefined;
      }

      const item = entry as Record<string, unknown>;
      const criterionId = toNonEmptyString(item.id) ?? `criterion-${index + 1}`;
      const score = normalizeScoreToPercentage(toNumber(item.score), outOf);
      const evidenceList = toStringArray(item.evidence);
      const improvementSuggestions = toStringArray(item.improvementSuggestions);

      const evidence =
        evidenceList?.join("\n") ??
        toNonEmptyString(item.levelDescriptor) ??
        "No evidence provided.";

      const notesParts: string[] = [];
      const levelDescriptor = toNonEmptyString(item.levelDescriptor);
      if (levelDescriptor) {
        notesParts.push(levelDescriptor);
      }
      const level = toNonEmptyString(item.level);
      const title = toNonEmptyString(item.title);
      if (level) {
        notesParts.push(title ? `${title}: ${level}` : `Level: ${level}`);
      }
      const weight = toNumber(item.weight);
      if (typeof weight === "number") {
        notesParts.push(`Weight: ${formatScore(weight)}`);
      }

      const actionItems = improvementSuggestions;

      return {
        criterionId,
        score,
        evidence,
        notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
        actionItems,
      };
    })
    .filter(isDefined);

  const finalCriteria =
    criteria.length > 0
      ? criteria
      : [
          {
            criterionId: "overall",
            score: overallScore,
            evidence: candidateNotes ?? "No rubric details provided.",
          },
        ];

  return {
    overallScore,
    summary,
    criteria: finalCriteria,
  };
}

function transformCriterionCentricRubric(payload: Record<string, unknown>): unknown {
  const criterionRaw = payload.criterion as Record<string, unknown> | undefined;
  if (!criterionRaw) {
    return payload;
  }

  const criterionId = toNonEmptyString(criterionRaw.id) ?? "criterion";
  const title = toNonEmptyString(criterionRaw.name) ?? criterionId;
  const rating = toNonEmptyString(criterionRaw.rating);
  const ratingDescription =
    toNonEmptyString(criterionRaw.ratingDescription ?? criterionRaw.rating_description) ??
    undefined;
  const weight = toNumber(criterionRaw.weight);
  const maxScore = toNumber(criterionRaw.maxScore ?? criterionRaw.max_score) ?? 100;
  const score = normalizeScoreToPercentage(toNumber(criterionRaw.score), maxScore);

  const evidencePayload = payload.evidence as Record<string, unknown> | undefined;
  const evidenceObservations = toStringArray(
    evidencePayload?.observations ?? evidencePayload?.obervations,
  );
  const evidenceTranscript = toStringArray(
    evidencePayload?.transcriptExcerpt ?? evidencePayload?.transcript_excerpt,
  );

  const strengths = toStringArray(payload.strengths);
  const improvements = toStringArray(payload.areasForImprovement ?? payload.areas_for_improvement);
  const actionable = toStringArray(
    payload.actionableRecommendations ?? payload.actionable_recommendations,
  );
  const nextSteps = toStringArray(payload.nextSteps ?? payload.next_steps);
  const improvedResponsePayload =
    (payload.exampleImprovedResponse as Record<string, unknown> | undefined) ??
    (payload.example_improved_response as Record<string, unknown> | undefined);
  const improvedVersion = toNonEmptyString(
    improvedResponsePayload?.improvedVersion ?? improvedResponsePayload?.improved_version,
  );

  const evidenceParts: string[] = [];
  if (evidenceObservations?.length) {
    evidenceParts.push(...evidenceObservations);
  }
  if (evidenceTranscript?.length) {
    evidenceParts.push(...evidenceTranscript.map((excerpt) => `Transcript excerpt: ${excerpt}`));
  }
  if (improvedVersion) {
    evidenceParts.push(`Improved response example: ${improvedVersion}`);
  }
  const evidence =
    evidenceParts.length > 0
      ? evidenceParts.join("\n")
      : "No evidence provided for this criterion.";

  const notesParts: string[] = [];
  if (ratingDescription) {
    notesParts.push(ratingDescription);
  }
  if (rating) {
    notesParts.push(`${title}: ${rating}`);
  }
  if (typeof weight === "number") {
    notesParts.push(`Weight: ${formatScore(weight)}`);
  }
  if (strengths?.length) {
    notesParts.push(`Strengths: ${strengths.join("; ")}`);
  }
  if (nextSteps?.length) {
    notesParts.push(`Next steps: ${nextSteps.join("; ")}`);
  }

  const actionItems = mergeStringArrays(improvements, actionable);

  const summaryParts: string[] = [ensureSentence(`${title} evaluation completed`)];
  if (rating) {
    summaryParts.push(ensureSentence(`Rating: ${rating}`));
  }
  if (ratingDescription) {
    summaryParts.push(ensureSentence(ratingDescription));
  }
  if (strengths?.length) {
    summaryParts.push(ensureSentence(`Strengths: ${strengths.join("; ")}`));
  }
  if (improvements?.length) {
    summaryParts.push(ensureSentence(`Areas for improvement: ${improvements.join("; ")}`));
  }

  const summary = summaryParts.join(" ").replace(/\s+/g, " ").trim();

  return {
    overallScore: score,
    summary: summary.length > 0 ? summary : `${title} evaluation completed.`,
    criteria: [
      {
        criterionId,
        score,
        evidence,
        notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
        actionItems,
      },
    ],
  };
}

function transformScoreReportRubric(payload: Record<string, unknown>): unknown {
  const scoreReport =
    (payload.scoreReport as Record<string, unknown> | undefined) ??
    (payload.score_report as Record<string, unknown> | undefined);

  if (!scoreReport) {
    return payload;
  }

  const criterionId =
    toNonEmptyString(scoreReport.criterionId ?? scoreReport.criterion_id) ?? "criterion";
  const title =
    toNonEmptyString(scoreReport.criterionTitle ?? scoreReport.criterion_title) ?? criterionId;
  const score = normalizeScoreToPercentage(
    toNumber(scoreReport.score),
    toNumber(scoreReport.maxScore ?? scoreReport.max_score) ?? 100,
  );
  const weight = toNumber(scoreReport.weight);
  const scoreLabel =
    toNonEmptyString(scoreReport.scoreLabel ?? scoreReport.score_label) ?? undefined;

  const evidencePayload = scoreReport.evidence as Record<string, unknown> | undefined;
  const observations = toStringArray(evidencePayload?.observations ?? evidencePayload?.observation);
  const transcriptExamples = toStringArray(
    evidencePayload?.transcriptExamples ?? evidencePayload?.transcript_examples,
  );

  const analysisPayload = scoreReport.analysis as Record<string, unknown> | undefined;
  const strengths = toStringArray(analysisPayload?.strengths ?? scoreReport.strengths);
  const improvements = toStringArray(
    analysisPayload?.areasForImprovement ?? analysisPayload?.areas_for_improvement,
  );

  const recommendations = toStringArray(scoreReport.recommendations);
  const nextSteps = toStringArray(scoreReport.nextSteps ?? scoreReport.next_steps);

  const sampleScript = toNonEmptyString(
    scoreReport.sampleImprovedScript ?? scoreReport.sample_improved_script,
  );

  const impactEstimate = scoreReport.impactEstimate ?? scoreReport.impact_estimate;
  const impactShortTerm = toNonEmptyString(
    (impactEstimate as Record<string, unknown> | undefined)?.shortTerm ??
      (impactEstimate as Record<string, unknown> | undefined)?.short_term,
  );
  const impactLongTerm = toNonEmptyString(
    (impactEstimate as Record<string, unknown> | undefined)?.longTerm ??
      (impactEstimate as Record<string, unknown> | undefined)?.long_term,
  );

  const evidenceParts: string[] = [];
  if (observations?.length) {
    evidenceParts.push(...observations);
  }
  if (transcriptExamples?.length) {
    evidenceParts.push(...transcriptExamples.map((example) => `Transcript example: ${example}`));
  }
  if (sampleScript) {
    evidenceParts.push(`Sample improved script: ${sampleScript}`);
  }

  const evidence =
    evidenceParts.length > 0
      ? evidenceParts.join("\n")
      : "No evidence provided for this criterion.";

  const notesParts: string[] = [];
  if (scoreLabel) {
    notesParts.push(`${title}: ${scoreLabel}`);
  }
  const description = toNonEmptyString(scoreReport.description);
  if (description) {
    notesParts.push(description);
  }
  if (typeof weight === "number") {
    notesParts.push(`Weight: ${formatScore(weight)}`);
  }
  if (strengths?.length) {
    notesParts.push(`Strengths: ${strengths.join("; ")}`);
  }
  if (nextSteps?.length) {
    notesParts.push(`Next steps: ${nextSteps.join("; ")}`);
  }
  if (impactShortTerm || impactLongTerm) {
    const impacts = [
      impactShortTerm ? `Short term: ${impactShortTerm}` : undefined,
      impactLongTerm ? `Long term: ${impactLongTerm}` : undefined,
    ]
      .filter(isDefined)
      .join("; ");
    if (impacts.length > 0) {
      notesParts.push(`Impact: ${impacts}`);
    }
  }

  const summaryParts: string[] = [ensureSentence(`${title} evaluation completed`)];
  if (scoreLabel) {
    summaryParts.push(ensureSentence(`Rating: ${scoreLabel}`));
  }
  if (description) {
    summaryParts.push(ensureSentence(description));
  }
  if (strengths?.length) {
    summaryParts.push(ensureSentence(`Strengths: ${strengths.join("; ")}`));
  }
  if (improvements?.length) {
    summaryParts.push(ensureSentence(`Areas for improvement: ${improvements.join("; ")}`));
  }
  if (recommendations?.length) {
    summaryParts.push(ensureSentence(`Recommendations: ${recommendations.join("; ")}`));
  }

  const summary = summaryParts.join(" ").replace(/\s+/g, " ").trim();

  return {
    overallScore: score,
    summary: summary.length > 0 ? summary : `${title} evaluation completed.`,
    criteria: [
      {
        criterionId,
        score,
        evidence,
        notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
        actionItems: mergeStringArrays(improvements, recommendations, nextSteps),
      },
    ],
  };
}

function normalizeScoreToPercentage(value: number | undefined, outOf: number): number {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? (value as number) : undefined;
  if (numericValue === undefined) {
    return 0;
  }
  if (Number.isFinite(outOf) && outOf > 0 && outOf !== 100) {
    return clampPercentage((numericValue / outOf) * 100);
  }
  return clampPercentage(numericValue);
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((entry) => toNonEmptyString(entry))
    .filter((entry): entry is string => typeof entry === "string");
  return items.length > 0 ? items : undefined;
}

function mergeStringArrays(...arrays: Array<string[] | undefined>): string[] | undefined {
  const result = arrays.reduce<string[]>((accumulator, current) => {
    if (current) {
      accumulator.push(...current.filter((entry) => entry.trim().length > 0));
    }
    return accumulator;
  }, []);

  return result.length > 0 ? Array.from(new Set(result)) : undefined;
}

function summarizeChoice(choice: ChatCompletion.Choice | undefined):
  | {
      finishReason?: string;
      messageRole?: string;
      contentType?: string;
      contentPreview?: string;
      refusal?: string;
      toolCallCount?: number;
    }
  | undefined {
  if (!choice) {
    return undefined;
  }

  const finishReason =
    (choice as { finish_reason?: string; finishReason?: string }).finish_reason ??
    (choice as { finishReason?: string }).finishReason;

  const message = choice.message as
    | {
        content?: unknown;
        role?: string;
        refusal?: unknown;
        tool_calls?: unknown[];
      }
    | undefined;

  const content = message?.content;
  let contentPreview: string | undefined;
  let contentType: string | undefined;

  if (typeof content === "string") {
    contentType = "string";
    contentPreview = truncateForLog(content);
  } else if (Array.isArray(content)) {
    contentType = "array";
    try {
      contentPreview = truncateForLog(JSON.stringify(content.slice(0, 2)));
    } catch {
      contentPreview = "[unserializable array]";
    }
  } else if (content !== undefined) {
    contentType = typeof content;
  }

  const refusal = typeof message?.refusal === "string" ? message.refusal : undefined;
  let toolCallCount: number | undefined;
  if (message && Array.isArray((message as { tool_calls?: unknown[] }).tool_calls)) {
    toolCallCount = (message as { tool_calls: unknown[] }).tool_calls.length;
  }

  return {
    finishReason,
    messageRole: message?.role,
    contentType,
    contentPreview,
    refusal,
    toolCallCount,
  };
}

function handleEmptyResponse(
  logger: Logger | undefined,
  context: string,
  response: ChatCompletion,
  choice: ChatCompletion.Choice | undefined,
  attempt: number,
  retries: number,
): void {
  const summary = summarizeChoice(choice);
  const payload: Record<string, unknown> = {
    context,
    attempt: attempt + 1,
    maxAttempts: retries + 1,
    responseId: response.id,
    finishReason: summary?.finishReason,
    messageRole: summary?.messageRole,
    contentType: summary?.contentType,
    contentPreview: summary?.contentPreview,
    refusal: summary?.refusal,
    toolCallCount: summary?.toolCallCount,
    usage: response.usage,
  };

  if (attempt < retries) {
    logger?.warn?.("OpenAI returned empty response, retrying", payload);
    if (!logger?.warn) {
      // eslint-disable-next-line no-console
      console.warn("[LLM][empty_response_retry]", payload);
    }
  } else {
    logger?.error?.("OpenAI returned empty response", payload);
    if (!logger?.error) {
      // eslint-disable-next-line no-console
      console.error("[LLM][empty_response_final]", payload);
    }
  }
}

function getEmptyResponseRetries(options?: LLMClientCallOptions): number {
  const rawValue =
    options?.metadata?.empty_response_retries ?? options?.metadata?.llm_empty_response_retries;

  if (rawValue) {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.min(parsed, MAX_EMPTY_RESPONSE_RETRIES);
    }
  }

  return DEFAULT_EMPTY_RESPONSE_RETRIES;
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

function toCamelCaseKey(key: string): string {
  if (!key.includes("_")) {
    return key;
  }

  const segments = key.split("_").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return key;
  }

  return segments
    .map((segment, index) =>
      index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1),
    )
    .join("");
}

function truncateForLog(value: string | null | undefined, maxLength = 500): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}… (truncated)`;
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

function extractMessageContent(
  choice: ChatCompletion.Choice | undefined,
  logger?: Logger,
  context?: string,
): string | null {
  if (!choice) {
    return null;
  }

  const message = choice.message as unknown;

  const maybeString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value : null;

  if (typeof message === "string") {
    return maybeString(message);
  }

  if (Array.isArray((message as { content?: unknown }).content)) {
    const contentParts = (message as { content: unknown[] }).content;
    const texts = contentParts
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (!part || typeof part !== "object") {
          return null;
        }
        const typedPart = part as { text?: unknown; json?: unknown };
        if (typeof typedPart.text === "string") {
          return typedPart.text;
        }
        if (typedPart.json && typeof typedPart.json === "object") {
          try {
            return JSON.stringify(typedPart.json);
          } catch (error) {
            logger?.warn?.("Failed to serialize json fragment from OpenAI", {
              context,
              error: error instanceof Error ? error.message : "unknown",
            });
            return null;
          }
        }
        return null;
      })
      .filter((text): text is string => typeof text === "string" && text.trim().length > 0);

    if (texts.length > 0) {
      return texts.join("\n");
    }
  }

  if (typeof message === "object" && message !== null) {
    const parsedField = (message as { parsed?: unknown }).parsed;
    if (typeof parsedField === "string" && parsedField.trim().length > 0) {
      return parsedField;
    }
    if (parsedField && typeof parsedField === "object") {
      try {
        return JSON.stringify(parsedField);
      } catch (error) {
        logger?.warn?.("Failed to serialize parsed message from OpenAI", {
          context,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    const directText = maybeString((message as { content?: unknown }).content);
    if (directText) {
      return directText;
    }
  }

  return null;
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
    const responseFormat: ChatCompletionCreateParamsNonStreaming["response_format"] =
      params.responseSchema
        ? {
            type: "json_schema",
            json_schema: params.responseSchema,
          }
        : { type: "json_object" };

    const requestPayload: ChatCompletionCreateParamsNonStreaming = {
      model: params.model,
      max_completion_tokens: params.maxTokens,
      response_format: responseFormat,
      messages: params.messages,
    };

    if (typeof params.temperature === "number") {
      requestPayload.temperature = params.temperature;
    }

    const retries = getEmptyResponseRetries(options);

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await client.chat.completions.create(requestPayload, {
          signal: options?.signal,
        });

        const choice = response.choices[0];
        const rawContent = extractMessageContent(choice, logger, context);

        if (!rawContent) {
          handleEmptyResponse(logger, context, response, choice, attempt, retries);

          if (attempt < retries) {
            continue;
          }

          const summary = summarizeChoice(choice);
          throw new LLMClientError({
            message: "Received empty response from OpenAI",
            code: "invalid_response",
            details: {
              attempts: attempt + 1,
              responseId: response.id,
              finishReason: summary?.finishReason,
              messageRole: summary?.messageRole,
              contentType: summary?.contentType,
              toolCallCount: summary?.toolCallCount,
              responseUsage: response.usage,
            },
          });
        }

        const transform =
          context === "interviewRubricEval"
            ? (data: unknown) => transformInterviewRubricEvalResponse(data)
            : undefined;
        return parseJsonResponse({ rawContent, schema, context, logger, transform });
      } catch (error) {
        if (error instanceof LLMClientError) {
          throw error;
        }
        handleOpenAiError(error, context, logger);
      }
    }

    throw new LLMClientError({
      message: "Received empty response from OpenAI",
      code: "invalid_response",
    });
  } catch (error) {
    if (error instanceof LLMClientError) {
      throw error;
    }
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
      const metadata = {
        ...(options?.metadata ?? {}),
        temperature: options?.metadata?.temperature ?? "0.2",
      };

      return runJsonCompletion(
        openai,
        { ...params, responseSchema: INTERVIEW_RUBRIC_JSON_SCHEMA },
        interviewRubricEvalSchema,
        "interviewRubricEval",
        logger,
        { ...options, metadata },
      );
    },

    async chatReply(input: ChatReplyInput, options?: LLMClientCallOptions): Promise<ChatReply> {
      const temperature = input.temperature ?? sanitizedConfig.temperature ?? DEFAULT_TEMPERATURE;

      try {
        const requestPayload: ChatCompletionCreateParamsNonStreaming = {
          model: sanitizedConfig.model,
          max_completion_tokens: input.maxTokens ?? sanitizedConfig.maxTokens ?? DEFAULT_MAX_TOKENS,
          messages: input.messages.map((message) => toChatCompletionMessage(message)),
        };

        if (typeof temperature === "number" && Number.isFinite(temperature) && temperature !== 1) {
          requestPayload.temperature = temperature;
        }

        const response = await openai.chat.completions.create(requestPayload, {
          signal: options?.signal,
        });

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
