import type {
  ChatReply,
  ChatReplyInput,
  EvaluateAnswerInput,
  EvaluateAnswerResult,
  GeneratePlanInput,
  GeneratePlanResult,
  InterviewRubricEvalInput,
  InterviewRubricEvalResult,
} from "./types";

export interface LLMProviderCallOptions {
  timeoutMs?: number;
  metadata?: Record<string, string>;
  signal?: AbortSignal;
}

export interface LLMProvider {
  generatePlan(
    input: GeneratePlanInput,
    options?: LLMProviderCallOptions,
  ): Promise<GeneratePlanResult>;

  evaluateAnswer(
    input: EvaluateAnswerInput,
    options?: LLMProviderCallOptions,
  ): Promise<EvaluateAnswerResult>;

  interviewRubricEval(
    input: InterviewRubricEvalInput,
    options?: LLMProviderCallOptions,
  ): Promise<InterviewRubricEvalResult>;

  chatReply(input: ChatReplyInput, options?: LLMProviderCallOptions): Promise<ChatReply>;
}
