import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import {
  FEATURE_FLAG_DEFAULTS,
  type FeatureFlagName,
  type FeatureFlags,
} from "../../shared/feature-flags/config";

const featureFlagsSchema = z.record(z.string(), z.boolean());

let cachedFlags: FeatureFlags | null = null;

function normalizeFlags(rawFlags: Record<string, boolean> | null): FeatureFlags {
  const flags: FeatureFlags = { ...FEATURE_FLAG_DEFAULTS };

  const knownFlags = Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlagName[];

  if (!rawFlags) {
    return flags;
  }

  for (const key of knownFlags) {
    if (typeof rawFlags[key] === "boolean") {
      flags[key] = rawFlags[key];
    }
  }

  return flags;
}

function loadFlagsFromEnv(): Record<string, boolean> | null {
  const envValue = process.env.FEATURE_FLAGS ?? process.env.NEXT_PUBLIC_FEATURE_FLAGS;

  if (!envValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(envValue);
    const result = featureFlagsSchema.safeParse(parsed);

    if (!result.success) {
      const reason = result.error.issues[0]?.message ?? "Unknown validation error";
      console.warn(`[feature-flags] Ignoring FEATURE_FLAGS env: ${reason}`);
      return null;
    }

    return result.data;
  } catch (error) {
    console.warn("[feature-flags] Failed to parse FEATURE_FLAGS env, ignoring value.", error);
    return null;
  }
}

function resolveFeatureFlagsFilePath(): string | null {
  const customPath = process.env.FEATURE_FLAGS_FILE;

  if (customPath) {
    return path.resolve(customPath);
  }

  const candidatePaths = [
    path.join(process.cwd(), "feature-flags.json"),
    path.join(process.cwd(), "apps", "web", "feature-flags.json"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function loadFlagsFromFile(): Record<string, boolean> | null {
  const filePath = resolveFeatureFlagsFilePath();

  if (!filePath) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8").trim();

    if (fileContent.length === 0) {
      return null;
    }

    const parsed = JSON.parse(fileContent);
    const result = featureFlagsSchema.safeParse(parsed);

    if (!result.success) {
      const reason = result.error.issues[0]?.message ?? "Unknown validation error";
      console.warn(`[feature-flags] Invalid feature flags file at ${filePath}: ${reason}`);
      return null;
    }

    return result.data;
  } catch (error) {
    console.warn(`[feature-flags] Failed to load feature flags from ${filePath}.`, error);
    return null;
  }
}

function loadFeatureFlags(): FeatureFlags {
  const envFlags = loadFlagsFromEnv();
  const fileFlags = envFlags ? null : loadFlagsFromFile();

  return normalizeFlags(envFlags ?? fileFlags);
}

export function getFeatureFlags(options?: { revalidate?: boolean }): FeatureFlags {
  if (!cachedFlags || options?.revalidate) {
    cachedFlags = loadFeatureFlags();
  }

  return cachedFlags;
}

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return getFeatureFlags()[flag];
}

export function withFeatureFlagGuard<Args extends unknown[]>(
  flag: FeatureFlagName,
  handler: (...args: Args) => Promise<Response> | Response,
  options?: { status?: number },
): (...args: Args) => Promise<Response> {
  const status = options?.status ?? 404;

  return async (...args: Args) => {
    if (!isFeatureEnabled(flag)) {
      return NextResponse.json(
        {
          error: "FEATURE_DISABLED",
          details: {
            feature: flag,
          },
        },
        { status },
      );
    }

    return handler(...args);
  };
}

export function listAvailableFeatureFlags(): FeatureFlags {
  return { ...FEATURE_FLAG_DEFAULTS };
}
