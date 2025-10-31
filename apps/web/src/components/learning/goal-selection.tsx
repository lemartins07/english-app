"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Database, Layout, Loader2, Server, Target } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@english-app/ui";

import { cn } from "@/lib/utils";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";

const TRACKS = [
  {
    id: "backend",
    name: "Backend Developer",
    icon: Server,
    description: "APIs, databases, microservices",
  },
  {
    id: "frontend",
    name: "Frontend Developer",
    icon: Layout,
    description: "React, UI/UX, web applications",
  },
  {
    id: "data",
    name: "Data Engineer",
    icon: Database,
    description: "Data pipelines, analytics, ETL",
  },
  {
    id: "devops",
    name: "DevOps Engineer",
    icon: Code2,
    description: "CI/CD, cloud, infrastructure",
  },
] as const;

interface GoalSelectionProps {
  defaultTrack?: string;
  defaultGoal?: string;
  onComplete: (track: string, goal: string) => void;
}

export function GoalSelection({
  defaultTrack = "",
  defaultGoal = "",
  onComplete,
}: GoalSelectionProps) {
  const [selectedTrack, setSelectedTrack] = useState(defaultTrack);
  const [selectedGoal, setSelectedGoal] = useState(defaultGoal);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedTrack || !selectedGoal) return;
    setIsGenerating(true);
    setTimeout(() => {
      onComplete(selectedTrack, selectedGoal);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      >
        <div className="space-y-2 text-center">
          <h1 className={cn("text-3xl font-semibold", learningSectionHeading)}>
            Personalize sua trilha
          </h1>
          <p className={cn(learningMutedText)}>
            Escolha sua área e objetivo para gerar um plano de estudos personalizado
          </p>
        </div>

        <Card className={cn(learningSurfaceCard)}>
          <CardHeader>
            <CardTitle className={cn(learningSectionHeading)}>Qual sua trilha técnica?</CardTitle>
            <CardDescription className={cn(learningMutedText)}>
              Selecione a área que você trabalha ou deseja trabalhar
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    learningSubtleCard,
                    isSelected
                      ? "border-blue-500/60 shadow-lg shadow-blue-500/10"
                      : "hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/10",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        isSelected
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-white/60 text-slate-500 dark:bg-neutral-800/70 dark:text-slate-300",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={cn("text-sm font-semibold", learningSectionHeading)}>
                        {track.name}
                      </h3>
                      <p className={cn("text-xs", learningMutedText)}>{track.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className={cn(learningSurfaceCard)}>
          <CardHeader>
            <CardTitle className={cn(learningSectionHeading)}>
              Qual seu objetivo principal?
            </CardTitle>
            <CardDescription className={cn(learningMutedText)}>
              Isso vai ajudar a personalizar seu plano de estudos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger className="rounded-xl border border-blue-500/30 bg-white/80 text-left shadow-sm focus:ring-blue-500 dark:bg-neutral-900/70">
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-blue-500/20 bg-white/95 shadow-lg shadow-blue-500/10 dark:border-neutral-800/60 dark:bg-neutral-900/95">
                <SelectItem value="interview">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Preparar para entrevistas técnicas</span>
                  </div>
                </SelectItem>
                <SelectItem value="fluency">Alcançar fluência geral</SelectItem>
                <SelectItem value="travel">Viagens e networking</SelectItem>
                <SelectItem value="work">Trabalho remoto internacional</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            className={cn("min-w-[220px]", learningPrimaryButton)}
            onClick={handleGenerate}
            disabled={!selectedTrack || !selectedGoal || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando seu plano...
              </>
            ) : (
              "Gerar meu plano"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
