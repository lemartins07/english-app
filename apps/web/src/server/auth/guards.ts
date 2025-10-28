import { NextResponse } from "next/server";

import { getObservabilityContext } from "@english-app/observability";

import { auth } from "./config";

export function withAuthGuard<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response> | Response,
  options?: { status?: number },
) {
  const status = options?.status ?? 401;

  return async (...args: Args) => {
    const session = await auth();

    if (!session?.user) {
      const { logger } = getObservabilityContext();
      logger.warn("API access blocked by auth guard", { route: "auth.guard" });
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          details: {
            reason: "Authentication required",
          },
        },
        { status },
      );
    }

    return handler(...args);
  };
}
