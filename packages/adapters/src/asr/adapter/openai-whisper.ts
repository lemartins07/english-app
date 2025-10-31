import { Buffer } from "buffer";
import * as mm from "music-metadata";
import { OpenAI } from "openai";

import type { ShortAudioTranscription, TranscribeShortAudioInput } from "@english-app/domain";

import type { ASRProvider, ASRProviderCallOptions } from "../ports/provider";
import type { TranscribeShortAudioResult } from "../types";

export interface OpenAIWhisperConfig {
  apiKey: string;
  organization?: string;
}

export class OpenAIWhisperAdapter implements ASRProvider {
  private readonly openai: OpenAI;

  constructor(config: OpenAIWhisperConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
  }

  public async transcribeShortAudio(
    input: TranscribeShortAudioInput,
    _options?: ASRProviderCallOptions,
  ): Promise<TranscribeShortAudioResult> {
    void _options;
    // For now, we'll assume the uri is a direct URL to the audio file.
    // In a real-world scenario, you might need to download the audio first.
    const audioBlob = await this.fetchAudioFile(input.fileRef.uri);
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());

    const metadata = await mm.parseBuffer(audioBuffer, audioBlob.type);
    const durationMs = metadata.format.duration ? Math.round(metadata.format.duration * 1000) : 0;

    const audioFile = new File([audioBlob], "audio.wav", { type: audioBlob.type });

    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: input.localeHint,
      prompt: input.prompt,
      response_format: "json",
      temperature: 0,
    });

    const transcription: ShortAudioTranscription = {
      transcript: response.text,
      durationMs: durationMs,
      // TODO: Implement word timestamps if needed and if Whisper API supports it directly
    };

    return {
      transcription,
      // TODO: Add usage information if available from OpenAI API
    };
  }

  private async fetchAudioFile(uri: string): Promise<File> {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file from ${uri}: ${response.statusText}`);
    }
    const blob = await response.blob();
    // OpenAI API expects a File object, so we need to convert the Blob.
    // The 'name' and 'type' properties are important.
    return new File([blob], "audio.wav", { type: blob.type });
  }
}
