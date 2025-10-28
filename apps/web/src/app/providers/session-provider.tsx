"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import type { SessionWithUser } from "../../server/auth";

interface AuthSessionProviderProps {
  session: SessionWithUser | null;
  children: ReactNode;
}

export function AuthSessionProvider({ session, children }: AuthSessionProviderProps) {
  return <SessionProvider session={session ?? undefined}>{children}</SessionProvider>;
}
