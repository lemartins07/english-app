import type {
  ShortAudioFileRef,
  ShortAudioTranscription,
  TranscribeShortAudioInput,
  WordTimestamps,
} from "@english-app/domain";

export type {
  ShortAudioFileRef,
  ShortAudioTranscription,
  TranscribeShortAudioInput,
  WordTimestamps,
};

export interface TranscribeShortAudioUsage {
  audioMs: number;
  billedMs?: number;
  requestUnits?: number;
}

export interface TranscribeShortAudioResult {
  transcription: ShortAudioTranscription;
  usage?: TranscribeShortAudioUsage;
}
