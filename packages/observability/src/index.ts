import type { Namespace } from "cls-hooked";
import { createNamespace, getNamespace } from "cls-hooked";

const OBS_NAMESPACE = "english-app-observability";
interface TypedNamespace extends Namespace {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): TypedNamespace;
}

const namespace = (getNamespace(OBS_NAMESPACE) ?? createNamespace(OBS_NAMESPACE)) as TypedNamespace;

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

export interface MetricsRecorder {
  observeDuration(metric: string, durationMs: number, labels?: Record<string, string>): void;
  recordEvent(name: string, payload?: Record<string, unknown>): void;
  snapshot(): MetricsSnapshot;
}

export interface MetricsSnapshot {
  timers: Record<
    string,
    {
      count: number;
      sumMs: number;
      p95: number;
      p99: number;
    }
  >;
  events: Record<string, number>;
}

export interface ObservabilityConfig {
  level: LogLevel;
  destination?: (entry: LogEntry) => void;
}

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel) {
  return levelOrder[targetLevel] >= levelOrder[currentLevel];
}

function createLogger(
  config: ObservabilityConfig,
  extraContext: Record<string, unknown> = {},
): Logger {
  const destination =
    config.destination ??
    ((entry: LogEntry) => {
      // Default destination logs JSON to stdout.
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    });

  const emit = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    if (!shouldLog(config.level, level)) {
      return;
    }

    const baseContext = namespace.get<Record<string, unknown>>("context") ?? {};
    const currentContext = {
      ...baseContext,
      ...extraContext,
      ...context,
    };

    destination({
      level,
      message,
      timestamp: new Date().toISOString(),
      context: currentContext,
    });
  };

  return {
    debug: (message, context) => emit("debug", message, context),
    info: (message, context) => emit("info", message, context),
    warn: (message, context) => emit("warn", message, context),
    error: (message, context) => emit("error", message, context),
    child: (context) => createLogger(config, { ...extraContext, ...context }),
  };
}

class InMemoryMetricsRecorder implements MetricsRecorder {
  private timers = new Map<
    string,
    {
      values: number[];
      sum: number;
    }
  >();

  private events = new Map<string, number>();

  observeDuration(metric: string, durationMs: number) {
    const timer = this.timers.get(metric) ?? { values: [], sum: 0 };
    timer.values.push(durationMs);
    timer.sum += durationMs;
    this.timers.set(metric, timer);
  }

  recordEvent(name: string) {
    const current = this.events.get(name) ?? 0;
    this.events.set(name, current + 1);
  }

  snapshot(): MetricsSnapshot {
    const timers: MetricsSnapshot["timers"] = {};

    for (const [key, timer] of this.timers) {
      const sorted = [...timer.values].sort((a, b) => a - b);
      const count = sorted.length;
      const p95 = percentile(sorted, 0.95);
      const p99 = percentile(sorted, 0.99);

      timers[key] = {
        count,
        sumMs: round(timer.sum),
        p95: round(p95),
        p99: round(p99),
      };
    }

    const events: MetricsSnapshot["events"] = {};
    for (const [key, value] of this.events) {
      events[key] = value;
    }

    return { timers, events };
  }
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.floor(ratio * values.length));
  return values[index];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export interface ObservabilityContext {
  logger: Logger;
  metrics: MetricsRecorder;
}

const defaultLogger = createLogger({ level: "info" });
const defaultMetrics = new InMemoryMetricsRecorder();

export function getObservabilityContext(): ObservabilityContext {
  return (
    namespace.get("observabilityContext") ?? {
      logger: defaultLogger,
      metrics: defaultMetrics,
    }
  );
}

export function runWithRequestContext<T>(
  context: Record<string, unknown>,
  callback: () => Promise<T>,
): Promise<T> {
  return namespace.runAndReturn(async () => {
    namespace.set("context", context);
    namespace.set("observabilityContext", {
      logger: defaultLogger.child(context),
      metrics: defaultMetrics,
    });

    return callback();
  });
}

export function configureObservability(config: ObservabilityConfig) {
  namespace.set("observabilityContext", {
    logger: createLogger(config),
    metrics: defaultMetrics,
  });
}

export function observe<T>(name: string, handler: () => Promise<T>) {
  const { metrics } = getObservabilityContext();
  const startedAt = performance.now();

  return handler().finally(() => {
    const duration = performance.now() - startedAt;
    metrics.observeDuration(name, duration);
  });
}
