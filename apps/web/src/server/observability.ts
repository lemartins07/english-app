import type { ObservabilityConfig } from "@english-app/observability";
import { configureObservability } from "@english-app/observability";

const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info") as ObservabilityConfig["level"];

export function setupObservability() {
  configureObservability({
    level: LOG_LEVEL,
  });
}
