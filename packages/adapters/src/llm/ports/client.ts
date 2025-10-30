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

export type LLMMethodMap = {
  generatePlan: {
    input: GeneratePlanInput;
    result: GeneratePlanResult;
  };
  evaluateAnswer: {
    input: EvaluateAnswerInput;
    result: EvaluateAnswerResult;
  };
  interviewRubricEval: {
    input: InterviewRubricEvalInput;
    result: InterviewRubricEvalResult;
  };
  chatReply: {
    input: ChatReplyInput;
    result: ChatReply;
  };
};

export type LLMMethod = keyof LLMMethodMap;

export type LLMArgs<M extends LLMMethod> = LLMMethodMap[M]["input"];

export type LLMResult<M extends LLMMethod> = LLMMethodMap[M]["result"];

export type LLMClient = {
  [M in LLMMethod]: (input: LLMArgs<M>, options?: LLMClientCallOptions) => Promise<LLMResult<M>>;
};

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
