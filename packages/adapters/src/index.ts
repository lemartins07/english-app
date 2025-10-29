import type { UseCase } from "@english-app/application";
import type { Logger } from "@english-app/observability";

export interface RepositoryAdapter<Entity> {
  findById(id: string): Promise<Entity | null>;
  save(entity: Entity): Promise<void>;
}

export interface AdapterContext {
  logger: Logger;
}

export function withLogging<Input, Output>(
  useCase: UseCase<Input, Output>,
  logger: Logger,
): UseCase<Input, Output> {
  return {
    async execute(input: Input) {
      logger.debug?.("Executing use case", { useCase: useCase.constructor.name });
      const result = await useCase.execute(input);
      logger.debug?.("Finished use case", { useCase: useCase.constructor.name });
      return result;
    },
  };
}

export * from "./asr";
export * from "./db";
export * from "./llm";
