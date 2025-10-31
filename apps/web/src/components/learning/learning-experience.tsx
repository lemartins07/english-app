"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";

import { useTheme } from "../../app/providers/theme-provider";

import { BottomNav } from "./bottom-nav";
import { GoalSelection } from "./goal-selection";
import { InterviewSimulator } from "./interview-simulator";
import { Lesson } from "./lesson";
import { LevelTest } from "./level-test";
import { ProgressDashboard } from "./progress-dashboard";
import { StudyPlan } from "./study-plan";
import { TeacherChat } from "./teacher-chat";
import { TopBar } from "./top-bar";
import { type LearningProfile, type LearningScreen } from "./types";
import { OnboardingWelcome } from "./welcome";

interface LearningExperienceProps {
  initialProfile: LearningProfile;
}

const defaultProfile: LearningProfile = {
  name: "",
  level: "",
  track: "",
  goal: "",
  currentDay: 1,
  completedDays: [1, 2],
  score: 200,
};

export function LearningExperience({ initialProfile }: LearningExperienceProps) {
  const [profile, setProfile] = useState<LearningProfile>({ ...defaultProfile, ...initialProfile });
  const [screen, setScreen] = useState<LearningScreen>(() => {
    if (!initialProfile.name) return "welcome";
    if (!initialProfile.level) return "levelTest";
    if (!initialProfile.track) return "goalSelection";
    return "studyPlan";
  });
  const [activeLessonDay, setActiveLessonDay] = useState<number>(profile.currentDay ?? 1);
  const { theme, setTheme } = useTheme();

  const showTopBar = useMemo(
    () => !["welcome", "levelTest", "goalSelection"].includes(screen),
    [screen],
  );

  const showBottomNav = showTopBar;

  const updateProfile = (updates: Partial<LearningProfile>) => {
    setProfile((prev: LearningProfile) => ({ ...prev, ...updates }));
  };

  const handleLessonComplete = () => {
    setProfile((prev: LearningProfile) => {
      const completed = prev.completedDays.includes(activeLessonDay)
        ? prev.completedDays
        : [...prev.completedDays, activeLessonDay];
      const nextDay = Math.min(7, activeLessonDay + 1);
      return {
        ...prev,
        completedDays: completed,
        currentDay: nextDay,
        score: prev.score + 100,
      };
    });
    setScreen("studyPlan");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-black">
      {showTopBar && (
        <TopBar
          profile={profile}
          theme={theme as "light" | "dark"}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          onLogout={() => signOut({ callbackUrl: "/" })}
        />
      )}

      <div className={showBottomNav ? "pb-20 md:pb-0" : ""}>
        {screen === "welcome" && (
          <OnboardingWelcome
            defaultName={profile.name}
            onUpdateProfile={(payload) => updateProfile(payload)}
            onNext={() => setScreen("levelTest")}
          />
        )}

        {screen === "levelTest" && (
          <LevelTest
            onComplete={(level) => {
              updateProfile({ level });
              setScreen("goalSelection");
            }}
          />
        )}

        {screen === "goalSelection" && (
          <GoalSelection
            onComplete={(track, goal) => {
              updateProfile({ track, goal });
              setScreen("studyPlan");
            }}
          />
        )}

        {screen === "studyPlan" && (
          <StudyPlan
            profile={profile}
            onStartLesson={(day) => {
              setActiveLessonDay(day);
              setScreen("lesson");
            }}
            onOpenChat={() => setScreen("chat")}
            onOpenDashboard={() => setScreen("dashboard")}
          />
        )}

        {screen === "lesson" && (
          <Lesson
            day={activeLessonDay}
            onComplete={handleLessonComplete}
            onOpenChat={() => setScreen("chat")}
          />
        )}

        {screen === "chat" && (
          <TeacherChat
            profile={profile}
            onBack={() => setScreen("studyPlan")}
            onStartInterview={() => setScreen("interview")}
          />
        )}

        {screen === "dashboard" && (
          <ProgressDashboard
            profile={profile}
            onBack={() => setScreen("studyPlan")}
            onStartInterview={() => setScreen("interview")}
          />
        )}

        {screen === "interview" && (
          <InterviewSimulator
            profile={profile}
            onBack={() => setScreen("dashboard")}
            onComplete={() => setScreen("dashboard")}
          />
        )}
      </div>

      {showBottomNav && (
        <BottomNav
          currentScreen={screen}
          onNavigate={(target) => setScreen(target)}
          profile={profile}
        />
      )}
    </div>
  );
}
