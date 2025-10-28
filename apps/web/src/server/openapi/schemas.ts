import { z } from "zod";

import { registry } from "./registry";

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    error: z.string().describe("Human readable error message."),
    details: z
      .record(z.string(), z.string())
      .optional()
      .describe("Additional metadata about the error."),
  }),
);
