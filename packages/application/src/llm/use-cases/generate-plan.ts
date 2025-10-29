import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { LLMProvider, LLMProviderCallOptions } from "../provider";
import type { GeneratePlanInput, GeneratePlanResult } from "../types";

import { mergeCallOptions } from "./helpers";

export interface GeneratePlanUseCaseDependencies {
  llmProvider: LLMProvider;
  defaultOptions?: LLMProviderCallOptions;
  logger?: Logger;
  metadataFactory?: (input: GeneratePlanInput) => Record<string, string>;
}

export class GeneratePlanUseCase implements UseCase<GeneratePlanInput, GeneratePlanResult> {
  private readonly llmProvider: LLMProvider;
  private readonly defaultOptions?: LLMProviderCallOptions;
  private readonly logger?: Logger;
  private readonly metadataFactory?: GeneratePlanUseCaseDependencies["metadataFactory"];

  constructor(dependencies: GeneratePlanUseCaseDependencies) {
    this.llmProvider = dependencies.llmProvider;
    this.defaultOptions = dependencies.defaultOptions;
    this.logger = dependencies.logger;
    this.metadataFactory = dependencies.metadataFactory;
  }

  async execute(input: GeneratePlanInput): Promise<GeneratePlanResult> {
    const metadata = this.metadataFactory?.(input);
    const options = mergeCallOptions(this.defaultOptions, metadata);

    try {
      const result = await this.llmProvider.generatePlan(input, options);
      this.logger?.info?.("LLM generated study plan", {
        weeks: result.weeks.length,
        timeframeWeeks: input.timeframeWeeks,
      });
      return result;
    } catch (error) {
      this.logger?.error?.("Failed to generate study plan via LLM", {
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  }
}
