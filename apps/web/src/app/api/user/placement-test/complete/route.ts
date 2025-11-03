import { NextResponse } from "next/server";

import { PrismaUserRepository } from "@english-app/adapters/db";
import { CompletePlacementTestUseCase } from "@english-app/application";
import { getObservabilityContext } from "@english-app/observability";

import { getCurrentUser, withAuthGuard } from "@/server/auth";
import { getPrisma } from "@/server/db/client";

export const POST = withAuthGuard(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        details: {
          reason: "User not found",
        },
      },
      { status: 401 },
    );
  }

  const prisma = getPrisma();

  try {
    const { logger } = getObservabilityContext();
    const useCase = new CompletePlacementTestUseCase({
      users: new PrismaUserRepository(prisma),
      logger,
    });

    const result = await useCase.execute({ userId: user.id });

    return NextResponse.json({
      success: true,
      hasCompletedPlacementTest: result.hasCompletedPlacementTest,
    });
  } catch (error) {
    console.error("Error updating placement test status:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        details: {
          reason: "Failed to update placement test status",
        },
      },
      { status: 500 },
    );
  }
});
