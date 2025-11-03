import { Buffer } from "buffer";
import * as mm from "music-metadata";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAI } from "openai";

import type { ShortAudioTranscription, TranscribeShortAudioInput } from "@english-app/domain";

import type { ASRProvider, ASRProviderCallOptions } from "../ports/provider";
import type { TranscribeShortAudioResult } from "../types";

type FileConstructor = new (
  fileBits: BlobPart[],
  fileName: string,
  options?: FilePropertyBag,
) => File;

class NodeCompatibleFile extends Blob implements File {
  public readonly lastModified: number;
  public readonly name: string;
  public readonly webkitRelativePath: string = "";

  public constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options?.lastModified ?? Date.now();
  }

  public get [Symbol.toStringTag](): string {
    return "File";
  }
}

const FileCtor: FileConstructor =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - `File` might not exist in the Node.js runtime
  typeof File !== "undefined" ? File : (NodeCompatibleFile as unknown as FileConstructor);

if (typeof File === "undefined") {
  (globalThis as unknown as { File: FileConstructor }).File = FileCtor;
}

export interface OpenAIWhisperConfig {
  apiKey: string;
  organization?: string;
}

const FAKE_AUDIO_PREFIX = "fake-audio-uri/";
const DEFAULT_AUDIO_TMP_DIR = process.env.UPLOAD_TMP_DIR ?? "/tmp";

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

    const audioFile = new FileCtor([audioBlob], "audio.wav", { type: audioBlob.type });

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

  private inferMimeTypeFromExtension(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case ".wav":
        return "audio/wav";
      case ".mp3":
        return "audio/mpeg";
      case ".m4a":
      case ".aac":
        return "audio/aac";
      case ".ogg":
        return "audio/ogg";
      case ".webm":
        return "audio/webm";
      default:
        return "application/octet-stream";
    }
  }

  private createFileFromBuffer(buffer: Buffer, fileName: string, type?: string): File {
    const contentType = type ?? this.inferMimeTypeFromExtension(fileName);
    const blobPart = buffer as unknown as BlobPart;
    return new FileCtor([blobPart], fileName, { type: contentType });
  }

  private async readLocalFile(resource: string): Promise<File> {
    const filePath = resource.startsWith("file://") ? fileURLToPath(resource) : resource;
    const resolvedPath = path.resolve(filePath);
    const buffer = await fs.readFile(resolvedPath);
    return this.createFileFromBuffer(buffer, path.basename(resolvedPath));
  }

  private async resolveFakeAudioUri(resource: string): Promise<File> {
    const relativePath = resource.slice(FAKE_AUDIO_PREFIX.length);
    if (!relativePath) {
      throw new Error(`Invalid fake audio uri "${resource}"`);
    }

    const baseDir = path.resolve(DEFAULT_AUDIO_TMP_DIR);
    const resolvedPath = path.resolve(baseDir, relativePath);

    if (!resolvedPath.startsWith(baseDir)) {
      throw new Error(`Fake audio uri "${resource}" resolves outside of allowed directory.`);
    }

    const buffer = await fs.readFile(resolvedPath);
    return this.createFileFromBuffer(buffer, path.basename(resolvedPath));
  }

  private createFileFromDataUri(dataUri: string): File {
    const match = dataUri.match(/^data:(?<type>[^;,]+)?(?:;charset=[^;,]+)?;base64,(?<data>.+)$/);
    if (!match || !match.groups?.data) {
      throw new Error("Audio data URI malformatada ou sem payload base64.");
    }

    const buffer = Buffer.from(match.groups.data, "base64");
    const contentType = match.groups.type ?? "audio/wav";
    const extension = contentType.split("/").pop() ?? "bin";
    return this.createFileFromBuffer(buffer, `audio.${extension}`, contentType);
  }

  private async fetchRemoteFile(url: string): Promise<File> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    const fileName = this.extractNameFromUrl(url) ?? "audio";
    return new FileCtor([blob], fileName, {
      type: blob.type || this.inferMimeTypeFromExtension(fileName),
    });
  }

  private extractNameFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.split("/").pop();
      return pathname ?? null;
    } catch {
      return null;
    }
  }

  private async fetchAudioFile(resource: string): Promise<File> {
    if (!resource) {
      throw new Error("Audio reference is empty.");
    }

    if (resource.startsWith("data:")) {
      return this.createFileFromDataUri(resource);
    }

    if (resource.startsWith(FAKE_AUDIO_PREFIX)) {
      return this.resolveFakeAudioUri(resource);
    }

    if (resource.startsWith("http://") || resource.startsWith("https://")) {
      return this.fetchRemoteFile(resource);
    }

    if (resource.startsWith("file://") || path.isAbsolute(resource)) {
      return this.readLocalFile(resource);
    }

    try {
      const parsedUrl = new URL(resource);
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return this.fetchRemoteFile(parsedUrl.toString());
      }
      if (parsedUrl.protocol === "file:") {
        return this.readLocalFile(parsedUrl.toString());
      }
    } catch {
      // Not a valid URL, fallthrough to try local path resolution below.
    }

    // Treat as relative path within tmp dir as a last resort
    const candidatePath = path.resolve(DEFAULT_AUDIO_TMP_DIR, resource);
    try {
      const buffer = await fs.readFile(candidatePath);
      return this.createFileFromBuffer(buffer, path.basename(candidatePath));
    } catch (error) {
      throw new Error(
        `Unsupported audio reference "${resource}". Expected um data URI, URL http(s) ou caminho de arquivo acessível. Erro original: ${(error as Error).message}`,
      );
    }
  }
}
