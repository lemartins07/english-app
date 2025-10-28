"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { FeatureFlagName, FeatureFlags } from "./config";

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

interface FeatureFlagsProviderProps {
  flags: FeatureFlags;
  children: ReactNode;
}

export function FeatureFlagsProvider({ flags, children }: FeatureFlagsProviderProps) {
  const value = useMemo(() => ({ ...flags }), [flags]);

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlags {
  const flags = useContext(FeatureFlagsContext);

  if (!flags) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider.");
  }

  return flags;
}

export function useFeatureFlag(flag: FeatureFlagName): boolean {
  const flags = useFeatureFlags();
  return flags[flag];
}
