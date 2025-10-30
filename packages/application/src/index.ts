import type { BaseEntity } from "@english-app/domain";
import type { Logger } from "@english-app/observability";

export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}

export interface UseCaseContext {
  logger: Logger;
  currentUser?: BaseEntity;
}

export type AsyncResult<T> = Promise<T>;

export * from "./llm";
export * from "./repositories";
export * from "./services/remote-call";
