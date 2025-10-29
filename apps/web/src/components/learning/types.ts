export type LearningScreen =
  | "welcome"
  | "levelTest"
  | "goalSelection"
  | "studyPlan"
  | "lesson"
  | "chat"
  | "dashboard"
  | "interview";

export interface LearningProfile {
  name: string;
  level: string;
  track: string;
  goal: string;
  currentDay: number;
  completedDays: number[];
  score: number;
}
