import { RetentionEventEmitter } from "@english-app/application";

export class ConsoleRetentionEventEmitter implements RetentionEventEmitter {
  emit(
    event: Parameters<RetentionEventEmitter["emit"]>[0],
    payload?: Record<string, unknown>,
  ): void {
    console.log(`[Retention Event] ${event}`, payload);
  }
}
