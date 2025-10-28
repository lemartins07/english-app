import { getObservabilityContext } from "@english-app/observability";

export type ProductEventName = "user.d0" | "user.d1" | "lesson.completed";

export function emitProductEvent(name: ProductEventName, payload?: Record<string, unknown>) {
  const { logger, metrics } = getObservabilityContext();
  logger.info("Product event emitted", { event: name, payload });
  metrics.recordEvent(`event.${name}`);
}
