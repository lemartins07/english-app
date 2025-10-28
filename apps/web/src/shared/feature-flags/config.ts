const FEATURE_FLAG_DEFAULTS_INTERNAL = {
  interviewSimulator: false,
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAG_DEFAULTS_INTERNAL;
export type FeatureFlags = Record<FeatureFlagName, boolean>;

export const FEATURE_FLAG_DEFAULTS: FeatureFlags = { ...FEATURE_FLAG_DEFAULTS_INTERNAL };
