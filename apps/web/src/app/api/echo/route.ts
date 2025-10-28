import { NextResponse } from "next/server";
import { z } from "zod";

import { registry } from "../../../server/openapi/registry";
import { ErrorResponseSchema } from "../../../server/openapi/schemas";

const EchoRequestSchema = registry.register(
  "EchoRequest",
  z.object({
    message: z.string().min(1, "Message must not be empty."),
  }),
);

const EchoResponseSchema = registry.register(
  "EchoResponse",
  z.object({
    message: z.string().describe("Echoed message."),
    receivedAt: z
      .string()
      .datetime({ offset: true })
      .describe("Timestamp at which the server received the message."),
  }),
);

registry.registerPath({
  method: "post",
  path: "/api/echo",
  summary: "Echo a message",
  description:
    "Simple utility endpoint that echoes a provided message. Useful as a template for new routes.",
  tags: ["Utility"],
  operationId: "postEcho",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: EchoRequestSchema,
          examples: {
            default: {
              value: { message: "Hello from the client!" },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Message echoed successfully.",
      content: {
        "application/json": {
          schema: EchoResponseSchema,
          examples: {
            success: {
              value: {
                message: "Hello from the client!",
                receivedAt: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
      },
    },
    400: {
      description: "Payload validation failed.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            invalid: {
              value: {
                error: "INVALID_REQUEST",
                details: {
                  reason: "Message must not be empty.",
                },
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
        },
      },
    },
  },
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST", details: { reason: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const parseResult = EchoRequestSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        details: {
          reason: parseResult.error.issues[0]?.message ?? "Invalid payload.",
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      message: parseResult.data.message,
      receivedAt: new Date().toISOString(),
    },
    { status: 200 },
  );
}
