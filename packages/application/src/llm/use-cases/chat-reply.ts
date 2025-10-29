import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { LLMProvider, LLMProviderCallOptions } from "../provider";
import type { ChatReply, ChatReplyInput } from "../types";

import { mergeCallOptions } from "./helpers";

export interface ChatReplyUseCaseDependencies {
  llmProvider: LLMProvider;
  defaultOptions?: LLMProviderCallOptions;
  logger?: Logger;
  metadataFactory?: (input: ChatReplyInput) => Record<string, string>;
}

export class ChatReplyUseCase implements UseCase<ChatReplyInput, ChatReply> {
  private readonly llmProvider: LLMProvider;
  private readonly defaultOptions?: LLMProviderCallOptions;
  private readonly logger?: Logger;
  private readonly metadataFactory?: ChatReplyUseCaseDependencies["metadataFactory"];

  constructor(dependencies: ChatReplyUseCaseDependencies) {
    this.llmProvider = dependencies.llmProvider;
    this.defaultOptions = dependencies.defaultOptions;
    this.logger = dependencies.logger;
    this.metadataFactory = dependencies.metadataFactory;
  }

  async execute(input: ChatReplyInput): Promise<ChatReply> {
    const metadata = this.metadataFactory?.(input);
    const options = mergeCallOptions(this.defaultOptions, metadata);

    try {
      const reply = await this.llmProvider.chatReply(input, options);
      this.logger?.debug?.("LLM chat reply generated", {
        messages: input.messages.length,
        completionTokens: reply.usage?.completionTokens,
      });
      return reply;
    } catch (error) {
      this.logger?.error?.("Failed to generate chat reply via LLM", {
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  }
}
