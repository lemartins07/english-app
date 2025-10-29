import type { LLMProviderCallOptions } from "../provider";

export function mergeCallOptions(
  base: LLMProviderCallOptions | undefined,
  metadata: Record<string, string> | undefined,
): LLMProviderCallOptions | undefined {
  if (!base && !metadata) {
    return undefined;
  }

  return {
    ...base,
    metadata: {
      ...(base?.metadata ?? {}),
      ...(metadata ?? {}),
    },
  };
}
