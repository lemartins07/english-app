import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { LLMProvider, LLMProviderCallOptions } from "../provider";
import type { EvaluateAnswerInput, EvaluateAnswerResult } from "../types";

import { mergeCallOptions } from "./helpers";

export interface EvaluateAnswerUseCaseDependencies {
  llmProvider: LLMProvider;
  defaultOptions?: LLMProviderCallOptions;
  logger?: Logger;
  metadataFactory?: (input: EvaluateAnswerInput) => Record<string, string>;
}

export class EvaluateAnswerUseCase implements UseCase<EvaluateAnswerInput, EvaluateAnswerResult> {
  private readonly llmProvider: LLMProvider;
  private readonly defaultOptions?: LLMProviderCallOptions;
  private readonly logger?: Logger;
  private readonly metadataFactory?: EvaluateAnswerUseCaseDependencies["metadataFactory"];

  constructor(dependencies: EvaluateAnswerUseCaseDependencies) {
    this.llmProvider = dependencies.llmProvider;
    this.defaultOptions = dependencies.defaultOptions;
    this.logger = dependencies.logger;
    this.metadataFactory = dependencies.metadataFactory;
  }

  async execute(input: EvaluateAnswerInput): Promise<EvaluateAnswerResult> {
    const metadata = this.metadataFactory?.(input);
    const options = mergeCallOptions(this.defaultOptions, metadata);

    try {
      const result = await this.llmProvider.evaluateAnswer(input, options);
      this.logger?.info?.("LLM evaluated answer", {
        criteria: input.evaluationCriteria.length,
        locale: input.locale ?? "default",
      });
      return result;
    } catch (error) {
      this.logger?.error?.("Failed to evaluate answer via LLM", {
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  }
}
