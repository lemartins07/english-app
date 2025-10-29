import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

import { runWithRequestContext } from "@english-app/observability";

import { auth } from "./src/server/auth";

const PUBLIC_PATHS = ["/", "/login", "/api/health", "/api/openapi.json", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default auth(async (request: NextAuthRequest) => {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return runWithRequestContext({ requestId, path: request.nextUrl.pathname }, async () => {
    const { pathname } = request.nextUrl;
    const responseHeaders = new Headers({ "x-request-id": requestId });
    const isProtected = !isPublicPath(pathname);
    const hasUser = Boolean(request.auth?.user);

    if (isProtected && !hasUser) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: "UNAUTHORIZED",
            details: {
              reason: "Authentication required",
            },
          },
          { status: 401, headers: responseHeaders },
        );
      }

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set("x-request-id", requestId);
      return redirectResponse;
    }

    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
