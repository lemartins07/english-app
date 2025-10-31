"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, MessageCircle, Play } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@english-app/ui";

import { cn } from "@/lib/utils";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";
import { type LearningProfile } from "./types";

const LESSONS = [
  {
    day: 1,
    title: "Interview Introductions",
    duration: "15 min",
    topics: "Greetings, self-introduction, STAR format",
  },
  { day: 2, title: "Technical Background", duration: "18 min", topics: "Stack, past projects" },
  {
    day: 3,
    title: "Problem-Solving Vocabulary",
    duration: "20 min",
    topics: "Debugging, optimization, architecture",
  },
  {
    day: 4,
    title: "Behavioral Questions",
    duration: "17 min",
    topics: "Teamwork, conflict, leadership",
  },
  {
    day: 5,
    title: "System Design Discussion",
    duration: "20 min",
    topics: "Scalability, trade-offs",
  },
  {
    day: 6,
    title: "Code Review Scenarios",
    duration: "16 min",
    topics: "Best practices, code quality",
  },
  {
    day: 7,
    title: "Mock Interview Practice",
    duration: "25 min",
    topics: "Full simulation with feedback",
  },
] as const;

interface StudyPlanProps {
  profile: LearningProfile;
  onStartLesson: (day: number) => void;
  onOpenChat: () => void;
  onOpenDashboard: () => void;
}

export function StudyPlan({ profile, onStartLesson, onOpenChat, onOpenDashboard }: StudyPlanProps) {
  const completionRate = (profile.completedDays.length / LESSONS.length) * 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className={cn("text-3xl font-semibold", learningSectionHeading)}>
              Olá, {profile.name || "dev"}! <span className="inline-block">👋</span>
            </h1>
            <p className={cn("text-sm", learningMutedText)}>
              Plano personalizado para {profile.track || "sua trilha"} • Nível{" "}
              {profile.level || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onOpenDashboard}
              className="border-transparent bg-white/70 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={onOpenChat} className={cn("shadow-lg", learningPrimaryButton)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Teacher AI
            </Button>
          </div>
        </header>

        <Card className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20">
          <CardContent className="px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Semana 1: Fundamentos de Entrevista
                </h2>
                <p className="text-sm text-blue-100">
                  7 lições • {Math.round(completionRate)}% concluído
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2">
                <span className="text-2xl font-bold">
                  {profile.completedDays.length}/{LESSONS.length}
                </span>
                <span className="text-xs uppercase tracking-wide text-blue-100">dias</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson, index) => {
            const isCompleted = profile.completedDays.includes(lesson.day);
            const isCurrent = lesson.day === profile.currentDay && !isCompleted;
            const isLocked = lesson.day > profile.currentDay && !isCompleted;

            return (
              <motion.div
                key={lesson.day}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative h-full"
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden border transition-shadow duration-300",
                    learningSubtleCard,
                    isCurrent ? "border-blue-500/70 shadow-xl shadow-blue-500/15" : "",
                    isLocked ? "opacity-70" : "hover:shadow-lg hover:shadow-blue-500/10",
                  )}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className={cn(
                          "border-transparent",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-white/70 text-slate-600 dark:bg-neutral-800/60 dark:text-slate-200",
                        )}
                      >
                        Dia {lesson.day}
                      </Badge>
                      <div className={cn("flex items-center gap-2 text-xs", learningMutedText)}>
                        <Clock className="h-3.5 w-3.5" />
                        {lesson.duration}
                      </div>
                    </div>
                    <CardTitle className={cn("text-base font-semibold", learningSectionHeading)}>
                      {lesson.title}
                    </CardTitle>
                    <p className={cn("text-sm leading-relaxed", learningMutedText)}>
                      {lesson.topics}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={cn(
                        "w-full",
                        isCompleted
                          ? "border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-300"
                          : learningPrimaryButton,
                      )}
                      variant={isCompleted ? "outline" : "default"}
                      disabled={isLocked}
                      onClick={() => onStartLesson(lesson.day)}
                    >
                      {isLocked ? (
                        "🔒 Bloqueado"
                      ) : isCompleted ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                          Revisar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {isCurrent ? "Continuar" : "Iniciar"}
                        </>
                      )}
                    </Button>
                  </CardContent>

                  {isCurrent ? (
                    <span className="absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow shadow-orange-500/30">
                      Atual
                    </span>
                  ) : null}
                </Card>
              </motion.div>
            );
          })}
        </section>

        <Card className={cn(learningSurfaceCard)}>
          <CardHeader>
            <CardTitle className={cn(learningSectionHeading)}>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Conversar com Teacher AI",
                icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
                action: onOpenChat,
              },
              {
                label: "Ver Progresso Detalhado",
                icon: <BarChart3 className="h-6 w-6 text-green-500" />,
                action: onOpenDashboard,
              },
              {
                label: "Simulador de Entrevista",
                icon: <span className="text-2xl">🎯</span>,
                action: () => undefined,
                disabled: profile.completedDays.length < 5,
                helper: "Complete 5 dias",
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.disabled ? undefined : item.action}
                className={cn(
                  "flex h-full flex-col justify-between rounded-2xl p-4 text-left transition-all",
                  learningSubtleCard,
                  item.disabled ? "opacity-60" : "hover:shadow-lg hover:shadow-blue-500/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{item.icon}</span>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full border-blue-500/30 text-blue-600")}
                  >
                    Rápido
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className={cn("text-sm font-semibold", learningSectionHeading)}>
                    {item.label}
                  </p>
                  {item.helper ? (
                    <p className={cn("text-xs", learningMutedText)}>{item.helper}</p>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Toque para abrir</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
