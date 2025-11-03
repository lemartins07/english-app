import { redirect } from "next/navigation";

import { LearningExperience } from "@/components/learning/learning-experience";
import type { LearningProfile } from "@/components/learning/types";
import { getCurrentUser } from "@/server/auth";

const FALLBACK_TRACKS = [
  "Backend Developer",
  "Frontend Developer",
  "Data Engineer",
  "DevOps Engineer",
];
const FALLBACK_LEVELS = ["B1", "B2"];

function buildInitialProfile(user: Awaited<ReturnType<typeof getCurrentUser>>): LearningProfile {
  const baseName = user?.name ?? user?.email?.split("@")[0] ?? "English Learner";
  const seedSource = user?.email ?? baseName;
  const seed = seedSource.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomTrack = FALLBACK_TRACKS[seed % FALLBACK_TRACKS.length];
  const randomLevel = FALLBACK_LEVELS[seed % FALLBACK_LEVELS.length];

  return {
    name: baseName,
    level: randomLevel,
    track: randomTrack,
    goal: "interview",
    currentDay: 3,
    completedDays: [1, 2],
    score: 280,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.hasCompletedPlacementTest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Finalize o teste de nivelamento</h1>
        <p className="mt-4 text-lg">Conclua o teste para destravar seu dashboard personalizado.</p>
      </div>
    );
  }

  const profile = buildInitialProfile(user);

  return <LearningExperience initialProfile={profile} />;
}

export const dynamic = "force-dynamic";
