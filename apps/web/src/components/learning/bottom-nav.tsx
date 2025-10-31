"use client";

import { BookOpen, Home, MessageCircle, Target } from "lucide-react";

import { cn } from "@/lib/utils";

import { learningGlassPanel } from "./theme";
import { type LearningProfile, type LearningScreen } from "./types";

interface BottomNavProps {
  currentScreen: LearningScreen;
  onNavigate: (screen: LearningScreen) => void;
  profile: LearningProfile;
}

const NAV_ITEMS: Array<{
  id: LearningScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: (profile: LearningProfile) => boolean;
}> = [
  { id: "studyPlan", label: "Início", icon: Home },
  { id: "lesson", label: "Lições", icon: BookOpen },
  { id: "chat", label: "Teacher", icon: MessageCircle },
  {
    id: "interview",
    label: "Entrevista",
    icon: Target,
    locked: (profile) => profile.completedDays.length < 5,
  },
];

export function BottomNav({ currentScreen, onNavigate, profile }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t md:hidden",
        learningGlassPanel,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        const isLocked = item.locked?.(profile) ?? false;

        return (
          <button
            key={item.id}
            onClick={() => !isLocked && onNavigate(item.id)}
            disabled={isLocked}
            className={[
              "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
              isActive
                ? "text-blue-600"
                : isLocked
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-600 hover:text-blue-600 dark:text-slate-300",
            ].join(" ")}
          >
            {isActive && (
              <span className="absolute inset-x-auto top-0 h-1 w-12 rounded-b-full bg-gradient-to-r from-blue-500 to-purple-500" />
            )}
            <div className="relative">
              <Icon className="h-5 w-5" />
              {isLocked && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] leading-4 dark:bg-neutral-700">
                  🔒
                </span>
              )}
            </div>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
