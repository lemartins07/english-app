import { LearningExperience } from "@/components/learning/learning-experience";
import { type LearningProfile } from "@/components/learning/types";

import { getCurrentUser } from "../../../server/auth";

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
  const profile = buildInitialProfile(user);

  return <LearningExperience initialProfile={profile} />;
}
