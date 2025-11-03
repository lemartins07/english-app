import { NextResponse } from "next/server";

import { getCurrentUser, withAuthGuard } from "@/server/auth";

export const GET = withAuthGuard(async () => {
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

  return NextResponse.json({
    hasCompletedPlacementTest: user.hasCompletedPlacementTest,
  });
});
