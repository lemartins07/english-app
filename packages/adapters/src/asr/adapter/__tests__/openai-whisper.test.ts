import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShortAudioFileRef, TranscribeShortAudioInput } from "@english-app/domain";

import { OpenAIWhisperAdapter } from "../openai-whisper";

// Mock the OpenAI API
const mockCreateTranscription = vi.fn();
vi.mock("openai", () => ({
  OpenAI: vi.fn(() => ({
    audio: {
      transcriptions: {
        create: mockCreateTranscription,
      },
    },
  })),
}));

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OpenAIWhisperAdapter", () => {
  const apiKey = "test-api-key";
  const organization = "test-organization";
  let adapter: OpenAIWhisperAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OpenAIWhisperAdapter({ apiKey, organization });
  });

  it("should transcribe short audio and return transcription with duration", async () => {
    const mockAudioBlob = new Blob(["dummy audio data"], { type: "audio/wav" });
    const mockAudioFileRef: ShortAudioFileRef = { uri: "http://example.com/audio.wav" };
    const mockInput: TranscribeShortAudioInput = {
      fileRef: mockAudioFileRef,
      localeHint: "en",
      prompt: "Hello world",
    };
    const mockOpenAIResponse = {
      text: "Hello world from OpenAI",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockAudioBlob),
    });

    mockCreateTranscription.mockResolvedValueOnce(mockOpenAIResponse);

    // Mock music-metadata parseBuffer to return a duration
    vi.mock("music-metadata", () => ({
      parseBuffer: vi.fn(() => Promise.resolve({ format: { duration: 5 } })),
    }));

    const result = await adapter.transcribeShortAudio(mockInput);

    expect(mockFetch).toHaveBeenCalledWith(mockAudioFileRef.uri);
    expect(mockCreateTranscription).toHaveBeenCalledWith({
      file: expect.any(File),
      model: "whisper-1",
      language: mockInput.localeHint,
      prompt: mockInput.prompt,
      response_format: "json",
      temperature: 0,
    });
    expect(result.transcription).toEqual({
      transcript: mockOpenAIResponse.text,
      durationMs: 5000, // 5 seconds * 1000 ms/s
    });
  });

  it("should throw an error if fetching audio fails", async () => {
    const mockAudioFileRef: ShortAudioFileRef = { uri: "http://example.com/audio.wav" };
    const mockInput: TranscribeShortAudioInput = {
      fileRef: mockAudioFileRef,
      localeHint: "en",
      prompt: "Hello world",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    await expect(adapter.transcribeShortAudio(mockInput)).rejects.toThrow(
      `Failed to fetch audio file from ${mockAudioFileRef.uri}: Not Found`,
    );
  });
});
