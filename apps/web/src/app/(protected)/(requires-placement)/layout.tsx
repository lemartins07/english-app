import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth, hasAuthEnvironment } from "@/server/auth";

interface RequiresPlacementLayoutProps {
  children: ReactNode;
}

export default async function RequiresPlacementLayout({ children }: RequiresPlacementLayoutProps) {
  if (!hasAuthEnvironment()) {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.hasCompletedPlacementTest) {
    redirect("/placement-test");
  }

  return <>{children}</>;
}
