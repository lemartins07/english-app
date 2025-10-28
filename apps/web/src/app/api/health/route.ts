import { NextResponse } from "next/server";
import { z } from "zod";

import { registry } from "../../../server/openapi/registry";
import { ErrorResponseSchema } from "../../../server/openapi/schemas";

const HealthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.literal("ok").describe("Indicates that the API is reachable."),
    timestamp: z
      .string()
      .datetime({ offset: true })
      .describe("ISO-8601 timestamp of the health check."),
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
              },
            },
          },
        },
      },
    },
    500: {
      description: "Unexpected error.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            failure: {
              value: {
                error: "SERVICE_UNAVAILABLE",
              },
            },
          },
        },
      },
    },
  },
});

export async function GET() {
  return NextResponse.json(
    {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=5",
      },
    },
  );
}
