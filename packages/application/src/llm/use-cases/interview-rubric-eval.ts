import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { LLMProvider, LLMProviderCallOptions } from "../provider";
import type { InterviewRubricEvalInput, InterviewRubricEvalResult } from "../types";

import { mergeCallOptions } from "./helpers";

export interface InterviewRubricEvalUseCaseDependencies {
  llmProvider: LLMProvider;
  defaultOptions?: LLMProviderCallOptions;
  logger?: Logger;
  metadataFactory?: (input: InterviewRubricEvalInput) => Record<string, string>;
}

export class InterviewRubricEvalUseCase
  implements UseCase<InterviewRubricEvalInput, InterviewRubricEvalResult>
{
  private readonly llmProvider: LLMProvider;
  private readonly defaultOptions?: LLMProviderCallOptions;
  private readonly logger?: Logger;
  private readonly metadataFactory?: InterviewRubricEvalUseCaseDependencies["metadataFactory"];

  constructor(dependencies: InterviewRubricEvalUseCaseDependencies) {
    this.llmProvider = dependencies.llmProvider;
    this.defaultOptions = dependencies.defaultOptions;
    this.logger = dependencies.logger;
    this.metadataFactory = dependencies.metadataFactory;
  }

  async execute(input: InterviewRubricEvalInput): Promise<InterviewRubricEvalResult> {
    const metadata = this.metadataFactory?.(input);
    const options = mergeCallOptions(this.defaultOptions, metadata);

    try {
      const result = await this.llmProvider.interviewRubricEval(input, options);
      this.logger?.info?.("LLM evaluated interview rubric", {
        rubricItems: input.rubric.length,
      });
      return result;
    } catch (error) {
      this.logger?.error?.("Failed to evaluate interview rubric via LLM", {
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  }
}
