import { NextResponse } from "next/server";

import { PrismaAssessmentSessionRepository } from "@english-app/adapters/db";
import { StartAssessmentUseCase } from "@english-app/application";

import { blueprintProvider } from "@/server/assessment/blueprint-provider";
import { ConsoleRetentionEventEmitter } from "@/server/assessment/retention-event-emitter";
import { getCurrentUser } from "@/server/auth/session";
import { getPrisma } from "@/server/db/client";

export async function POST() {
  const prisma = getPrisma();

  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const useCase = new StartAssessmentUseCase({
    sessions: new PrismaAssessmentSessionRepository(prisma),
    blueprints: blueprintProvider,
    events: new ConsoleRetentionEventEmitter(),
  });

  const result = await useCase.execute({
    userId: user.id,
    blueprintId: "bp-leveling",
    requestedAt: new Date().toISOString(),
  });

  return NextResponse.json(result);
}
