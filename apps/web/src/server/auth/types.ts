import type { Session } from "next-auth";
import type { Role } from "@prisma/client";

export type SessionWithUser = Session & {
  user: Session["user"] & {
    id: string;
    role: Role;
    hasCompletedPlacementTest: boolean;
  };
};
