import * as mm from "music-metadata";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Mock } from "vitest";
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

// Mock music-metadata
vi.mock("music-metadata", () => ({
  parseBuffer: vi.fn(),
}));

const parseBufferMock = mm.parseBuffer as unknown as Mock;

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("OpenAIWhisperAdapter", () => {
  const apiKey = "test-api-key";
  const organization = "test-organization";
  let adapter: OpenAIWhisperAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    parseBufferMock.mockReset();
    mockFetch.mockReset();
    delete process.env.UPLOAD_TMP_DIR;
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

    parseBufferMock.mockResolvedValueOnce({ format: { duration: 5 } });

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

  it("should handle data URIs without fetching", async () => {
    const base64Audio = Buffer.from("audio data").toString("base64");
    const dataUri = `data:audio/wav;base64,${base64Audio}`;
    const mockFileRef: ShortAudioFileRef = { uri: dataUri };
    const mockInput: TranscribeShortAudioInput = {
      fileRef: mockFileRef,
    };

    parseBufferMock.mockResolvedValueOnce({ format: { duration: 2 } });
    mockCreateTranscription.mockResolvedValueOnce({ text: "transcribed" });

    await adapter.transcribeShortAudio(mockInput);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCreateTranscription).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.any(File) }),
    );
  });

  it("should resolve fake audio uris from the tmp directory", async () => {
    const originalTmp = process.env.UPLOAD_TMP_DIR;
    const tmpDir = path.resolve("/tmp");
    process.env.UPLOAD_TMP_DIR = tmpDir;
    const fakeFileName = "sample.wav";
    const fakeUri = `fake-audio-uri/${fakeFileName}`;
    const mockBuffer = Buffer.from("audio");

    const readFileSpy = vi.spyOn(fs, "readFile").mockResolvedValueOnce(mockBuffer);
    parseBufferMock.mockResolvedValueOnce({ format: { duration: 1 } });
    mockCreateTranscription.mockResolvedValueOnce({ text: "ok" });

    const mockInput: TranscribeShortAudioInput = {
      fileRef: { uri: fakeUri },
    };

    await adapter.transcribeShortAudio(mockInput);

    expect(readFileSpy).toHaveBeenCalledWith(path.resolve(tmpDir, fakeFileName));

    process.env.UPLOAD_TMP_DIR = originalTmp;
  });

  it("should throw for unsupported audio references", async () => {
    const readFileSpy = vi.spyOn(fs, "readFile").mockRejectedValueOnce(new Error("ENOENT"));
    const mockInput: TranscribeShortAudioInput = {
      fileRef: { uri: "unknown-audio" },
    };

    await expect(adapter.transcribeShortAudio(mockInput)).rejects.toThrow(
      /Unsupported audio reference/,
    );
    expect(readFileSpy).toHaveBeenCalled();
  });
});
