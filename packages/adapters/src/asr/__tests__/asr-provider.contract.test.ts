import { describe, expect, it, vi } from "vitest";

import {
  type ASRClient,
  ASRClientError,
  createASRProviderAdapter,
  type TranscribeShortAudioInput,
} from "..";

function createStubClient(): ASRClient {
  return {
    async transcribeShortAudio(input: TranscribeShortAudioInput) {
      void input;
      return {
        transcription: {
          transcript: "Hello there",
          durationMs: 3_200,
        },
        usage: {
          audioMs: 3_200,
          billedMs: 3_500,
        },
      };
    },
  };
}

describe("ASR provider adapter contract", () => {
  it("delegates to the underlying client", async () => {
    const adapter = createASRProviderAdapter(createStubClient(), { defaultTimeoutMs: 1_000 });

    const result = await adapter.transcribeShortAudio({
      fileRef: {
        uri: "s3://bucket/audio.wav",
        sizeBytes: 120_000,
        durationMs: 3_200,
        contentType: "audio/wav",
      },
      localeHint: "en-US",
    });

    expect(result.transcription.transcript).toBe("Hello there");
    expect(result.transcription.durationMs).toBe(3_200);
  });

  it("throws a timeout error when the client does not respond in time", async () => {
    vi.useFakeTimers();
    try {
      const abortingClient: ASRClient = {
        transcribeShortAudio: (_input, options) =>
          new Promise((_resolve, reject) => {
            const error = new Error("aborted");
            error.name = "AbortError";
            options?.signal?.addEventListener("abort", () => reject(error));
          }),
      };

      const adapter = createASRProviderAdapter(abortingClient, { defaultTimeoutMs: 50 });

      const pending = adapter.transcribeShortAudio(
        {
          fileRef: {
            uri: "s3://bucket/audio.wav",
            durationMs: 3_200,
          },
        },
        { timeoutMs: 10 },
      );

      const expectation = expect(pending).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(20);

      await expectation;
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps client errors to provider errors", async () => {
    const failingClient: ASRClient = {
      transcribeShortAudio: async () => {
        throw new ASRClientError({
          message: "Rate limited",
          status: 429,
          code: "rate_limit_exceeded",
        });
      },
    };

    const adapter = createASRProviderAdapter(failingClient);

    await expect(
      adapter.transcribeShortAudio({
        fileRef: {
          uri: "s3://bucket/audio.wav",
          sizeBytes: 64_000,
        },
      }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("respects caller supplied abort signal", async () => {
    const client: ASRClient = {
      transcribeShortAudio: async (_input, options) =>
        new Promise((_resolve, reject) => {
          const error = new Error("aborted");
          error.name = "AbortError";
          options?.signal?.addEventListener("abort", () => reject(error));
        }),
    };

    const adapter = createASRProviderAdapter(client, { defaultTimeoutMs: 1_000 });

    const controller = new AbortController();
    const promise = adapter.transcribeShortAudio(
      {
        fileRef: {
          uri: "s3://bucket/audio.wav",
        },
      },
      { signal: controller.signal },
    );

    controller.abort("caller");

    await expect(promise).rejects.toMatchObject({
      code: "CANCELLED",
    });
  });

  it("rejects audio that exceeds configured limits", async () => {
    const adapter = createASRProviderAdapter(createStubClient(), {
      limits: {
        maxDurationMs: 3_000,
        maxFileSizeBytes: 100_000,
      },
    });

    await expect(
      adapter.transcribeShortAudio({
        fileRef: {
          uri: "s3://bucket/audio.wav",
          durationMs: 3_500,
          sizeBytes: 90_000,
        },
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    await expect(
      adapter.transcribeShortAudio({
        fileRef: {
          uri: "s3://bucket/audio.wav",
          durationMs: 2_500,
          sizeBytes: 150_000,
        },
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("fails fast when provider returns invalid duration", async () => {
    const invalidClient: ASRClient = {
      transcribeShortAudio: async () => ({
        transcription: {
          transcript: "Hi",
          durationMs: Number.NaN,
        },
      }),
    };

    const adapter = createASRProviderAdapter(invalidClient);

    await expect(
      adapter.transcribeShortAudio({
        fileRef: {
          uri: "s3://bucket/audio.wav",
        },
      }),
    ).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});
