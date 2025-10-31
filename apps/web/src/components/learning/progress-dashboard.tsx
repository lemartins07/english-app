"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Calendar, Clock, Download, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@english-app/ui";

import { cn } from "@/lib/utils";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";
import { type LearningProfile } from "./types";

interface ProgressDashboardProps {
  profile: LearningProfile;
  onBack: () => void;
  onStartInterview: () => void;
}

export function ProgressDashboard({ profile, onBack, onStartInterview }: ProgressDashboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [
    { day: "Seg", minutes: profile.completedDays.includes(1) ? 15 : 0 },
    { day: "Ter", minutes: profile.completedDays.includes(2) ? 18 : 0 },
    { day: "Qua", minutes: profile.completedDays.includes(3) ? 20 : 0 },
    { day: "Qui", minutes: profile.completedDays.includes(4) ? 17 : 0 },
    { day: "Sex", minutes: profile.completedDays.includes(5) ? 20 : 0 },
    { day: "Sáb", minutes: profile.completedDays.includes(6) ? 16 : 0 },
    { day: "Dom", minutes: profile.completedDays.includes(7) ? 25 : 0 },
  ];

  const totalMinutes = chartData.reduce((acc, day) => acc + day.minutes, 0);
  const completionRate = Math.round((profile.completedDays.length / 7) * 100);
  const streak = profile.completedDays.length;

  const achievements = [
    {
      id: 1,
      icon: "🔥",
      title: "Primeira Lição",
      description: "Complete sua primeira lição",
      unlocked: profile.completedDays.length >= 1,
    },
    {
      id: 2,
      icon: "⚡",
      title: "Streak de 3 dias",
      description: "Estude por 3 dias seguidos",
      unlocked: profile.completedDays.length >= 3,
    },
    {
      id: 3,
      icon: "🎯",
      title: "Meio Caminho",
      description: "Complete 50% do plano",
      unlocked: completionRate >= 50,
    },
    {
      id: 4,
      icon: "🏆",
      title: "Semana Completa",
      description: "Complete todas as 7 lições",
      unlocked: profile.completedDays.length >= 7,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-fit rounded-full bg-white/60 px-4 text-slate-700 shadow-sm hover:bg-white/80 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao plano
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-transparent bg-white/70 px-4 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar progresso
          </Button>
        </header>

        <div className="space-y-2 text-center">
          <h1 className={cn("text-3xl font-semibold", learningSectionHeading)}>Seu progresso</h1>
          <p className={cn("text-sm", learningMutedText)}>
            Acompanhe sua evolução semanal e conquistas
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              title: "Dias concluídos",
              value: `${profile.completedDays.length}/7`,
              icon: <Calendar className="h-6 w-6 text-blue-600" />,
              accent: "from-blue-500/20 to-purple-500/20",
            },
            {
              title: "Tempo estudado",
              value: `${totalMinutes} min`,
              icon: <Clock className="h-6 w-6 text-green-500" />,
              accent: "from-green-500/20 to-emerald-500/20",
            },
            {
              title: "Pontuação",
              value: profile.score,
              icon: <Award className="h-6 w-6 text-orange-500" />,
              accent: "from-orange-500/20 to-amber-500/20",
            },
            {
              title: "Streak",
              value: `${streak} 🔥`,
              icon: <TrendingUp className="h-6 w-6 text-rose-500" />,
              accent: "from-rose-500/20 to-pink-500/20",
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(learningSubtleCard, "h-full")}>
                <CardContent className="flex items-center justify-between px-4 py-6">
                  <div>
                    <p className={cn("text-xs uppercase tracking-wide", learningMutedText)}>
                      {card.title}
                    </p>
                    <p className={cn("text-2xl font-semibold", learningSectionHeading)}>
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br",
                      card.accent,
                    )}
                  >
                    {card.icon}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <Card className={cn(learningSurfaceCard)}>
          <CardHeader>
            <CardTitle className={cn(learningSectionHeading)}>Atividade semanal</CardTitle>
            <CardDescription className={cn(learningMutedText)}>
              Minutos estudados por dia
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: "rgba(79, 70, 229, 0.08)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.3)",
                      boxShadow: "0px 12px 24px rgba(15, 23, 42, 0.12)",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  />
                  <Bar dataKey="minutes" radius={[8, 8, 0, 0]} fill="url(#minutesGradient)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Carregando gráfico...
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className={cn(learningSurfaceCard)}>
            <CardHeader>
              <CardTitle className={cn(learningSectionHeading)}>Progresso do plano</CardTitle>
              <CardDescription className={cn(learningMutedText)}>
                Semana 1 - Fundamentos de Entrevista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={cn(learningMutedText)}>Conclusão total</span>
                  <span className="font-semibold text-blue-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3 bg-white/60" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                      ✓
                    </span>
                    Lições concluídas
                  </div>
                  <Badge className="bg-green-500 text-white">{profile.completedDays.length}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                      ▶
                    </span>
                    Próxima lição
                  </div>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                    Dia {profile.currentDay}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
                      ⏱
                    </span>
                    Tempo dedicado
                  </div>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-600">
                    {totalMinutes} min
                  </Badge>
                </div>
              </div>

              <Button onClick={onStartInterview} className={cn("w-full", learningPrimaryButton)}>
                <Target className="mr-2 h-4 w-4" />
                Iniciar simulador de entrevista
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(learningSurfaceCard)}>
            <CardHeader>
              <CardTitle className={cn(learningSectionHeading)}>Conquistas</CardTitle>
              <CardDescription className={cn(learningMutedText)}>
                Colecione badges conforme avança
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3",
                    learningSubtleCard,
                    achievement.unlocked
                      ? "border border-blue-500/30 shadow shadow-blue-500/10"
                      : "opacity-60",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{achievement.icon}</span>
                    <div>
                      <p className={cn("text-sm font-semibold", learningSectionHeading)}>
                        {achievement.title}
                      </p>
                      <p className={cn("text-xs", learningMutedText)}>{achievement.description}</p>
                    </div>
                  </div>
                  {achievement.unlocked ? (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow shadow-blue-500/20">
                      Conquistada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-white/40 text-slate-500">
                      Em progresso
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
