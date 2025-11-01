import { NextResponse } from "next/server";

import { OpenAIWhisperAdapter } from "@english-app/adapters/asr/adapter/openai-whisper";
import { PrismaAssessmentSessionRepository } from "@english-app/adapters/db";
import { createLLMProviderAdapter } from "@english-app/adapters/llm/adapter/create-llm-provider-adapter";
import { createOpenAiLLMClient } from "@english-app/adapters/llm/client/openai";
import {
  InterviewRubricEvalUseCase,
  SubmitAssessmentResponseUseCase,
  TranscribeSpeakingAudioService,
} from "@english-app/application";

import { blueprintProvider } from "@/server/assessment/blueprint-provider";
import { ConsoleRetentionEventEmitter } from "@/server/assessment/retention-event-emitter";
import { getCurrentUser } from "@/server/auth/session";
import { getPrisma } from "@/server/db/client";
const prisma = getPrisma();
import { getEnv } from "@/server/env";
const env = getEnv();

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
    return new NextResponse("OpenAI API key or model not configured", { status: 500 });
  }

  const whisperAdapter = new OpenAIWhisperAdapter({
    apiKey: env.OPENAI_API_KEY,
  });

  const transcribeAudioService = new TranscribeSpeakingAudioService(whisperAdapter);

  const llmClient = createOpenAiLLMClient({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });

  const llmProvider = createLLMProviderAdapter(llmClient);

  const interviewRubricEvalUseCase = new InterviewRubricEvalUseCase({
    llmProvider,
  });

  const useCase = new SubmitAssessmentResponseUseCase({
    sessions: new PrismaAssessmentSessionRepository(prisma),
    blueprints: blueprintProvider,
    events: new ConsoleRetentionEventEmitter(),
    transcribe: transcribeAudioService,
    interviewRubric: interviewRubricEvalUseCase,
  });

  const body = await req.json();

  const result = await useCase.execute(body);

  return NextResponse.json(result);
}
