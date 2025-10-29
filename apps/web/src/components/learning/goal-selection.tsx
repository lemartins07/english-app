"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Database, Layout, Loader2, Server, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-blue-900">Personalize sua trilha</h1>
          <p className="text-muted-foreground">
            Escolha sua área e objetivo para gerar um plano de estudos personalizado
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Qual sua trilha técnica?</CardTitle>
            <CardDescription>
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
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-border hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        isSelected ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{track.name}</h3>
                      <p className="text-xs text-muted-foreground">{track.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qual seu objetivo principal?</CardTitle>
            <CardDescription>Isso vai ajudar a personalizar seu plano de estudos</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent>
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
            className="min-w-[220px] bg-blue-600 hover:bg-blue-700"
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
