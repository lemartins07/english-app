import { redirect } from "next/navigation";

import { getObservabilityContext } from "@english-app/observability";

import { auth, hasAuthEnvironment } from "./config";
import type { SessionWithUser } from "./types";

export async function getSession(): Promise<SessionWithUser | null> {
  if (!hasAuthEnvironment()) {
    return null;
  }

  const session = await auth();
  return (session ?? null) as SessionWithUser | null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser(options?: { redirectTo?: string }) {
  const session = await getSession();
  if (!session?.user) {
    const { logger } = getObservabilityContext();
    logger.warn("Unauthorized access attempt", { route: "auth.requireUser" });
    redirect(options?.redirectTo ?? "/login");
  }

  return session.user;
}
