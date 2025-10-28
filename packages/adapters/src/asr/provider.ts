import type { TranscribeShortAudioInput, TranscribeShortAudioResult } from "./types";

export interface ASRProviderCallOptions {
  timeoutMs?: number;
  metadata?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ASRProvider {
  transcribeShortAudio(
    input: TranscribeShortAudioInput,
    options?: ASRProviderCallOptions,
  ): Promise<TranscribeShortAudioResult>;
}
