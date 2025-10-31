import type { ASRProvider } from "@english-app/adapters/asr/ports/provider";
import type { TranscribeShortAudioResult } from "@english-app/adapters/asr/types";
import type { TranscribeShortAudioInput } from "@english-app/domain";

export interface TranscribeSpeakingAudioUseCase {
  execute(input: TranscribeShortAudioInput): Promise<TranscribeShortAudioResult>;
}

export class TranscribeSpeakingAudioService implements TranscribeSpeakingAudioUseCase {
  constructor(private readonly asrProvider: ASRProvider) {}

  public async execute(input: TranscribeShortAudioInput): Promise<TranscribeShortAudioResult> {
    return this.asrProvider.transcribeShortAudio(input);
  }
}
