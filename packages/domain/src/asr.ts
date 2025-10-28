export interface ShortAudioFileRef {
  /** Fully-qualified location for the stored audio (e.g. S3 url or bucket/key). */
  uri: string;
  /** Raw size of the artifact in bytes, if known. */
  sizeBytes?: number;
  /** MIME type for the stored audio. */
  contentType?: string;
  /** Approximate duration in milliseconds, if metadata already available. */
  durationMs?: number;
}

export interface TranscribeShortAudioInput {
  fileRef: ShortAudioFileRef;
  /**
   * Optional language hint (BCP-47) that helps providers choose the right model.
   * Example: "en-US".
   */
  localeHint?: string;
  /** Optional context prompt to steer diarization or vocabulary. */
  prompt?: string;
}

export interface WordTimestamps {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface ShortAudioTranscription {
  transcript: string;
  /** Total audio duration measured by the ASR provider. */
  durationMs: number;
  /** Language detected or confirmed by the provider, when available. */
  language?: string;
  /** Optional per-word metadata for richer feedback. */
  words?: WordTimestamps[];
}
