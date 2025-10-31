"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Mic, Star, Volume2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Textarea,
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

const QUESTIONS = [
  {
    question: "Tell me about yourself and your experience as a developer.",
    hint: "Use STAR format. Mention years of experience, main technologies, and a key achievement.",
  },
  {
    question: "Describe a challenging bug you fixed recently. How did you approach it?",
    hint: "Situation → Task → Action → Result. Be specific about your debugging process.",
  },
  {
    question: "How do you handle disagreements with team members about technical decisions?",
    hint: "Show communication skills, empathy, and focus on data-driven decisions.",
  },
] as const;

type Phase = "intro" | "interview" | "results";

const RUBRIC_SCORES = {
  fluency: 4,
  vocabulary: 5,
  grammar: 4,
  star: 5,
} as const;

interface InterviewSimulatorProps {
  profile: LearningProfile;
  onComplete: () => void;
  onBack: () => void;
}

export function InterviewSimulator({ profile, onBack, onComplete }: InterviewSimulatorProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const progress = useMemo(
    () => ((currentQuestion + 1) / QUESTIONS.length) * 100,
    [currentQuestion],
  );

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setCurrentAnswer(
        "This is a simulated transcription of your recorded answer. In the full product your speech would be converted to text with ASR.",
      );
    }, 2000);
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) return;
    setCurrentAnswer("");

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setPhase("results");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="rounded-full bg-white/70 px-4 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {phase === "interview" && (
            <Badge className="flex items-center gap-2 bg-gradient-to-r from-red-500/80 to-rose-500/80 text-white shadow shadow-rose-500/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Em andamento
            </Badge>
          )}
        </header>

        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20">
              <CardContent className="space-y-4 px-4 py-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl">
                  🎯
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-white">Simulador de Entrevista</h1>
                  <p className="mx-auto max-w-2xl text-sm text-blue-100">
                    Prepare-se para entrevistas reais praticando com nossa IA. Você receberá
                    feedback detalhado sobre fluência, vocabulário e técnica STAR.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(learningSurfaceCard)}>
              <CardHeader>
                <CardTitle className={cn(learningSectionHeading)}>Como funciona</CardTitle>
                <CardDescription className={cn(learningMutedText)}>
                  O que esperar da simulação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 text-center md:grid-cols-3">
                  {[
                    {
                      step: "1️⃣",
                      title: "3 perguntas",
                      description: `Perguntas típicas de entrevistas para ${profile.track}`,
                    },
                    {
                      step: "2️⃣",
                      title: "Grave ou escreva",
                      description: "Responda por áudio ou texto",
                    },
                    {
                      step: "3️⃣",
                      title: "Feedback IA",
                      description: "Análise detalhada com rubrica",
                    },
                  ].map((item) => (
                    <div key={item.step} className="space-y-2 px-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-lg font-semibold text-blue-600">
                        {item.step}
                      </div>
                      <h3 className={cn("text-sm font-semibold", learningSectionHeading)}>
                        {item.title}
                      </h3>
                      <p className={cn("text-xs", learningMutedText)}>{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Dica:</strong> Fale naturalmente e use exemplos específicos. Lembre-se
                  do formato STAR: Situation, Task, Action, Result.
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    size="lg"
                    className={cn("px-8", learningPrimaryButton)}
                    onClick={() => setPhase("interview")}
                  >
                    Começar simulação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "interview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <div className={cn("flex items-center justify-between text-sm", learningMutedText)}>
                <span>
                  Pergunta {currentQuestion + 1} de {QUESTIONS.length}
                </span>
                <span>{Math.round(progress)}% concluído</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/70" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <Card className={cn(learningSurfaceCard)}>
                  <CardHeader>
                    <CardTitle className={cn(learningSectionHeading)}>
                      {QUESTIONS[currentQuestion].question}
                    </CardTitle>
                    <CardDescription className={cn(learningMutedText)}>
                      {QUESTIONS[currentQuestion].hint}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-300"
                        onClick={() => setCurrentAnswer("")}
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Ver exemplo
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleRecord}
                        disabled={isRecording}
                        className={cn(
                          "rounded-full",
                          isRecording
                            ? "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500"
                            : learningPrimaryButton,
                        )}
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        {isRecording ? "Gravando..." : "Gravar resposta"}
                      </Button>
                    </div>

                    <Textarea
                      value={currentAnswer}
                      onChange={(event) => setCurrentAnswer(event.target.value)}
                      rows={6}
                      placeholder="Transcreva sua resposta ou anote os pontos principais..."
                      className="resize-none rounded-2xl border border-blue-500/30 bg-white/80 shadow-inner focus-visible:border-blue-500 focus-visible:ring-blue-500 dark:bg-neutral-900/70"
                    />

                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-200">
                      <AlertCircle className="mr-2 inline h-4 w-4" />
                      Use exemplos concretos e métricas sempre que possível.
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className={cn(
                  "rounded-full px-6",
                  currentAnswer.trim()
                    ? learningPrimaryButton
                    : "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500",
                )}
              >
                {currentQuestion === QUESTIONS.length - 1 ? "Finalizar" : "Próxima pergunta"}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={cn(learningSurfaceCard)}>
              <CardHeader>
                <CardTitle className={cn(learningSectionHeading)}>Resultado da simulação</CardTitle>
                <CardDescription className={cn(learningMutedText)}>
                  Feedback detalhado com base nas suas respostas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Fluência", score: RUBRIC_SCORES.fluency },
                    { label: "Vocabulário", score: RUBRIC_SCORES.vocabulary },
                    { label: "Gramática", score: RUBRIC_SCORES.grammar },
                    { label: "Estratégia STAR", score: RUBRIC_SCORES.star },
                  ].map((item) => (
                    <Card key={item.label} className={cn(learningSubtleCard, "border")}>
                      <CardContent className="flex items-center justify-between px-4 py-5">
                        <div>
                          <p className={cn("text-xs uppercase tracking-wide", learningMutedText)}>
                            {item.label}
                          </p>
                          <p className={cn("text-xl font-semibold", learningSectionHeading)}>
                            {item.score}/5
                          </p>
                        </div>
                        <Star className="h-6 w-6 text-amber-400" />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 p-6 text-sm leading-relaxed">
                  <p className={cn("font-semibold", learningSectionHeading)}>
                    🎉 Excelente desempenho!
                  </p>
                  <p className={cn("mt-2", learningMutedText)}>
                    Sua prática contínua está rendendo resultados. Recomendo focar em respostas mais
                    concisas e em métricas específicas para destacar impacto.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="rounded-full border-transparent bg-white/70 px-6 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
                  >
                    Voltar ao progresso
                  </Button>
                  <Button
                    onClick={onComplete}
                    className={cn("rounded-full px-6", learningPrimaryButton)}
                  >
                    Continuar plano
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
