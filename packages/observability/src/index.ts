export interface Logger {
  info(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  warn?(message: string, metadata?: Record<string, unknown>): void;
  debug?(message: string, metadata?: Record<string, unknown>): void;
}

export interface Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): Span;
}

export interface Span {
  setAttribute(key: string, value: unknown): void;
  end(): void;
}

export class NoopLogger implements Logger {
  info(): void {}
  error(): void {}
  warn(): void {}
  debug(): void {}
}
