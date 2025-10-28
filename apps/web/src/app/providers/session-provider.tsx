"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import type { SessionWithUser } from "../../server/auth";
import type { FeatureFlags } from "../../shared/feature-flags/config";
import { FeatureFlagsProvider } from "../../shared/feature-flags/context";

interface AppProvidersProps {
  session: SessionWithUser | null;
  featureFlags: FeatureFlags;
  children: ReactNode;
}

export function AppProviders({ session, featureFlags, children }: AppProvidersProps) {
  return (
    <SessionProvider session={session ?? undefined}>
      <FeatureFlagsProvider flags={featureFlags}>{children}</FeatureFlagsProvider>
    </SessionProvider>
  );
}
