import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ASRProvider } from "@english-app/adapters/asr/ports/provider";
import type {
  TranscribeShortAudioInput,
  TranscribeShortAudioResult,
} from "@english-app/adapters/asr/types";
import { ShortAudioFileRef } from "@english-app/domain";

import { TranscribeSpeakingAudioService } from "../transcribe-speaking-audio";

describe("TranscribeSpeakingAudioService", () => {
  let mockAsrProvider: ASRProvider;
  let service: TranscribeSpeakingAudioService;

  beforeEach(() => {
    mockAsrProvider = {
      transcribeShortAudio: vi.fn(),
    };
    service = new TranscribeSpeakingAudioService(mockAsrProvider);
  });

  it("should call the ASR provider and return the transcription result", async () => {
    const mockFileRef: ShortAudioFileRef = {
      uri: "http://example.com/audio.wav",
      contentType: "audio/wav",
    };
    const mockInput: TranscribeShortAudioInput = {
      fileRef: mockFileRef,
      localeHint: "en-US",
    };
    const mockResult: TranscribeShortAudioResult = {
      transcription: {
        transcript: "This is a test transcription.",
        durationMs: 1000,
      },
    };

    vi.mocked(mockAsrProvider.transcribeShortAudio).mockResolvedValue(mockResult);

    const result = await service.execute(mockInput);

    expect(mockAsrProvider.transcribeShortAudio).toHaveBeenCalledWith(mockInput);
    expect(result).toEqual(mockResult);
  });

  it("should propagate errors from the ASR provider", async () => {
    const mockFileRef: ShortAudioFileRef = {
      uri: "http://example.com/audio.wav",
      contentType: "audio/wav",
    };
    const mockInput: TranscribeShortAudioInput = {
      fileRef: mockFileRef,
    };
    const mockError = new Error("ASR service error");

    vi.mocked(mockAsrProvider.transcribeShortAudio).mockRejectedValue(mockError);

    await expect(service.execute(mockInput)).rejects.toThrow(mockError);
  });
});
