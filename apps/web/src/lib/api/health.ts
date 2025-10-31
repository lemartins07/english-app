import { z } from "zod";

import { ApiRequestError } from "./errors";

const dependencySchema = z.object({
  status: z.literal("ok"),
  latencyMs: z.number(),
});

const metricsSchema = z.object({
  timers: z.record(
    z.string(),
    z.object({
      count: z.number(),
      sumMs: z.number(),
      p95: z.number(),
      p99: z.number(),
    }),
  ),
  events: z.record(z.string(), z.number()),
});

const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().min(1),
  dependencies: z.object({
    database: dependencySchema,
  }),
  metrics: metricsSchema,
});

const errorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

function parseJson(text: string, status: number) {
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError("Resposta inválida do endpoint /api/health.", {
      status,
      body: text,
    });
  }
}

export async function fetchHealth(options: { signal?: AbortSignal } = {}): Promise<HealthResponse> {
  const response = await fetch("/api/health", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: options.signal,
  });

  const rawBody = await response.text();
  const data = parseJson(rawBody, response.status);

  if (!response.ok) {
    const parsedError = data ? errorResponseSchema.safeParse(data) : null;
    const message =
      parsedError && parsedError.success
        ? parsedError.data.error
        : `Falha ao consultar saúde da API (status ${response.status}).`;

    throw new ApiRequestError(message, { status: response.status, body: data });
  }

  const parsed = healthResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApiRequestError("Estrutura de resposta inesperada do health check.", {
      status: response.status,
      body: data,
    });
  }

  return parsed.data;
}
