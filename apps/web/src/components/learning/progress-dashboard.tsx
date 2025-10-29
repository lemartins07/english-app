"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Award, Calendar, Clock, Download, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { type LearningProfile } from "./types";

interface ProgressDashboardProps {
  profile: LearningProfile;
  onBack: () => void;
  onStartInterview: () => void;
}

export function ProgressDashboard({ profile, onBack, onStartInterview }: ProgressDashboardProps) {
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
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao plano
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar progresso
          </Button>
        </header>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-blue-900">Seu progresso</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe sua evolução semanal e conquistas
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              title: "Dias concluídos",
              value: `${profile.completedDays.length}/7`,
              icon: <Calendar className="h-6 w-6 text-blue-600" />,
              bg: "bg-blue-100",
            },
            {
              title: "Tempo estudado",
              value: `${totalMinutes} min`,
              icon: <Clock className="h-6 w-6 text-green-600" />,
              bg: "bg-green-100",
            },
            {
              title: "Pontuação",
              value: profile.score,
              icon: <Award className="h-6 w-6 text-orange-600" />,
              bg: "bg-orange-100",
            },
            {
              title: "Streak",
              value: `${streak} 🔥`,
              icon: <TrendingUp className="h-6 w-6 text-red-600" />,
              bg: "bg-red-100",
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center justify-between px-4 py-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-semibold">{card.value}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${card.bg}`}
                  >
                    {card.icon}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Atividade semanal</CardTitle>
            <CardDescription>Minutos estudados por dia</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0px 12px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Progresso do plano</CardTitle>
              <CardDescription>Semana 1 - Fundamentos de Entrevista</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Conclusão total</span>
                  <span className="font-semibold text-blue-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                      ✓
                    </span>
                    Lições concluídas
                  </div>
                  <Badge className="bg-green-500 text-white">{profile.completedDays.length}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                      ▶
                    </span>
                    Próxima lição
                  </div>
                  <Badge variant="outline">Dia {profile.currentDay}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conquistas</CardTitle>
              <CardDescription>Desbloqueie badges conforme progride</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={[
                    "rounded-lg border p-4 text-center text-sm transition",
                    achievement.unlocked
                      ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
                      : "border-dashed border-muted bg-muted text-muted-foreground opacity-70",
                  ].join(" ")}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <p className="mt-1 font-semibold">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pronto para o próximo desafio?</h3>
              <p className="text-sm text-blue-100">
                {profile.completedDays.length < 5
                  ? `Complete mais ${5 - profile.completedDays.length} lições para desbloquear o simulador`
                  : "Teste suas habilidades no Simulador de Entrevista Técnica"}
              </p>
            </div>
            <Button
              size="lg"
              onClick={onStartInterview}
              disabled={profile.completedDays.length < 5}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Target className="mr-2 h-4 w-4" />
              {profile.completedDays.length < 5 ? "🔒 Bloqueado" : "Iniciar simulação"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
