import { NextResponse } from "next/server";

import { PrismaAssessmentSessionRepository, PrismaUserRepository } from "@english-app/adapters/db";
import { FinalizeAssessmentUseCase } from "@english-app/application";

import { blueprintProvider } from "@/server/assessment/blueprint-provider";
import { ConsoleRetentionEventEmitter } from "@/server/assessment/retention-event-emitter";
import { getCurrentUser } from "@/server/auth/session";
import { getPrisma } from "@/server/db/client";
const prisma = getPrisma();

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const useCase = new FinalizeAssessmentUseCase({
    sessions: new PrismaAssessmentSessionRepository(prisma),
    users: new PrismaUserRepository(prisma),
    blueprints: blueprintProvider,
    events: new ConsoleRetentionEventEmitter(),
  });

  const body = await req.json();

  const result = await useCase.execute(body);

  return NextResponse.json(result);
}
