import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { runWithRequestContext } from "@english-app/observability";

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return runWithRequestContext({ requestId, path: request.nextUrl.pathname }, async () => {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
