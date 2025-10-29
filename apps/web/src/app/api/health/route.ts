import { NextResponse } from "next/server";
import { z } from "zod";

import { getObservabilityContext, observe } from "@english-app/observability";

import { getPrisma } from "../../../server/db/client";
import { registry } from "../../../server/openapi/registry";
import { ErrorResponseSchema } from "../../../server/openapi/schemas";

const HealthDependencySchema = z.object({
  status: z.literal("ok").describe("Indicates that the dependency is reachable."),
  latencyMs: z
    .number()
    .nonnegative()
    .describe("Execution time for the dependency check in milliseconds."),
});

const HealthMetricsSchema = z.object({
  timers: z
    .record(
      z.string(),
      z.object({
        count: z.number().int().nonnegative(),
        sumMs: z.number().nonnegative(),
        p95: z.number().nonnegative(),
        p99: z.number().nonnegative(),
      }),
    )
    .describe("Performance timers captured during the application's lifecycle."),
  events: z
    .record(z.string(), z.number().int().nonnegative())
    .describe("Event counters captured during the application's lifecycle."),
});

const HealthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.literal("ok").describe("Indicates that the API is reachable."),
    timestamp: z
      .string()
      .datetime({ offset: true })
      .describe("ISO-8601 timestamp of the health check."),
    dependencies: z
      .object({
        database: HealthDependencySchema.describe(
          "Status information about the PostgreSQL database.",
        ),
      })
      .describe("Status for the application's critical dependencies."),
    metrics: HealthMetricsSchema,
  }),
);

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  description: "Returns the API health status. Use it for readiness probes and monitoring.",
  tags: ["Health"],
  operationId: "getHealth",
  responses: {
    200: {
      description: "Service is healthy.",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
          examples: {
            healthy: {
              value: {
                status: "ok",
                timestamp: "2024-01-01T12:00:00.000Z",
                dependencies: {
                  database: {
                    status: "ok",
                    latencyMs: 2,
                  },
                },
                metrics: {
                  timers: {},
                  events: {},
                },
              },
            },
          },
        },
      },
    },
    503: {
      description: "Service is unavailable because a dependency is unreachable.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            failure: {
              value: {
                error: "SERVICE_UNAVAILABLE",
                details: {
                  dependency: "database",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const dynamic = "force-dynamic";

export async function GET() {
  const { metrics, logger } = getObservabilityContext();

  return observe("api.health", async () => {
    const prisma = getPrisma();
    logger.debug("Health check invoked", { route: "api.health" });
    const dbCheckStartedAt = performance.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Database health check failed", { route: "api.health", message });
      metrics.recordEvent("api.health.database_unavailable");

      return NextResponse.json(
        {
          error: "SERVICE_UNAVAILABLE",
          details: {
            dependency: "database",
          },
        },
        { status: 503 },
      );
    }

    const dbLatency = Math.round((performance.now() - dbCheckStartedAt) * 100) / 100;
    metrics.recordEvent("api.health.ok");
    const snapshot = metrics.snapshot();

    return NextResponse.json(
      {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        dependencies: {
          database: {
            status: "ok" as const,
            latencyMs: dbLatency,
          },
        },
        metrics: snapshot,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=5",
        },
      },
    );
  });
}
