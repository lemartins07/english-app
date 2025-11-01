import { NextRequest, NextResponse } from "next/server";

import { OpenAIWhisperAdapter } from "@english-app/adapters";
import { TranscribeSpeakingAudioService } from "@english-app/application";
import { ShortAudioFileRef, TranscribeShortAudioInput } from "@english-app/domain";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const localeHint = formData.get("localeHint") as string | null;
    const prompt = formData.get("prompt") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!localeHint) {
      return NextResponse.json({ error: "No localeHint provided" }, { status: 400 });
    }

    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const asrProvider = new OpenAIWhisperAdapter({ apiKey: openAIApiKey });
    const transcribeService = new TranscribeSpeakingAudioService(asrProvider);

    // For now, we'll create a dummy fileRef.uri. In a real scenario, the audio might be uploaded to a storage service first.
    const fileRef: ShortAudioFileRef = {
      uri: "data:audio/wav;base64," + Buffer.from(await audioFile.arrayBuffer()).toString("base64"),
    };

    const input: TranscribeShortAudioInput = {
      fileRef: fileRef,
      localeHint: localeHint,
      prompt: prompt || undefined,
    };

    const result = await transcribeService.execute(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
