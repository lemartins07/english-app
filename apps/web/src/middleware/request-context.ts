import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { runWithRequestContext } from "@english-app/observability";

const headerName = "x-request-id";

export async function withRequestContext(request: Request, handler: () => Promise<Response>) {
  const existingRequestId = request.headers.get(headerName);
  const requestId = existingRequestId ?? randomUUID();

  return runWithRequestContext({ requestId }, async () => {
    const response = await handler();
    response.headers.set(headerName, requestId);
    return response;
  });
}

export function requestContextMiddleware() {
  return NextResponse.next();
}
