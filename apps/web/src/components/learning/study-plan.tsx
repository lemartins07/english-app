"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, MessageCircle, Play } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@english-app/ui";

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
            <h1 className="text-3xl font-semibold text-blue-900">
              Olá, {profile.name || "dev"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Plano personalizado para {profile.track || "sua trilha"} • Nível{" "}
              {profile.level || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onOpenDashboard}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={onOpenChat}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Teacher AI
            </Button>
          </div>
        </header>

        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
              <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2">
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
                  className={[
                    "h-full overflow-hidden border transition-shadow",
                    isCurrent ? "border-blue-500 shadow-lg" : "",
                    isLocked ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className={isCompleted ? "bg-green-500 text-white" : ""}
                      >
                        Dia {lesson.day}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {lesson.duration}
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold">{lesson.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lesson.topics}</p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={isCompleted ? "w-full" : "w-full bg-blue-600 hover:bg-blue-700"}
                      variant={isCompleted ? "outline" : "default"}
                      disabled={isLocked}
                      onClick={() => onStartLesson(lesson.day)}
                    >
                      {isLocked ? (
                        "🔒 Bloqueado"
                      ) : isCompleted ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
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
                    <span className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                      Atual
                    </span>
                  ) : null}
                </Card>
              </motion.div>
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
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
                icon: <BarChart3 className="h-6 w-6 text-green-600" />,
                action: onOpenDashboard,
              },
              {
                label: "Simulador de Entrevista",
                icon: <span className="text-2xl">🎯</span>,
                action: () => undefined,
                disabled: profile.completedDays.length < 5,
                helper: "Complete 5 dias",
              },
            ].map(({ label, icon, action, disabled, helper }) => (
              <Fragment key={label}>
                <Button
                  variant="outline"
                  className="h-auto flex-1 flex-col py-6 text-center text-sm"
                  onClick={action}
                  disabled={disabled}
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center">
                    {icon}
                  </div>
                  {label}
                  {helper ? (
                    <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>
                  ) : null}
                </Button>
              </Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
