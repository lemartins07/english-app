import type {
  ChatReply,
  ChatReplyInput,
  EvaluateAnswerInput,
  EvaluateAnswerResult,
  GeneratePlanInput,
  GeneratePlanResult,
  InterviewRubricEvalInput,
  InterviewRubricEvalResult,
} from "../types";

export interface LLMClientCallOptions {
  signal?: AbortSignal;
  metadata?: Record<string, string>;
}

export interface LLMClient {
  generatePlan(
    input: GeneratePlanInput,
    options?: LLMClientCallOptions,
  ): Promise<GeneratePlanResult>;

  evaluateAnswer(
    input: EvaluateAnswerInput,
    options?: LLMClientCallOptions,
  ): Promise<EvaluateAnswerResult>;

  interviewRubricEval(
    input: InterviewRubricEvalInput,
    options?: LLMClientCallOptions,
  ): Promise<InterviewRubricEvalResult>;

  chatReply(input: ChatReplyInput, options?: LLMClientCallOptions): Promise<ChatReply>;
}

export interface LLMClientErrorParams {
  message: string;
  status?: number;
  code?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class LLMClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryable?: boolean;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(params: LLMClientErrorParams) {
    super(params.message);
    this.name = "LLMClientError";
    this.status = params.status;
    this.code = params.code;
    this.retryable = params.retryable;
    this.details = params.details;
    this.cause = params.cause;
  }
}

export function isLLMClientError(error: unknown): error is LLMClientError {
  return error instanceof LLMClientError;
}
