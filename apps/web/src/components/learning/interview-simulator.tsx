"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle2, Mic, Star, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

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

  const averageScore =
    (RUBRIC_SCORES.fluency +
      RUBRIC_SCORES.vocabulary +
      RUBRIC_SCORES.grammar +
      RUBRIC_SCORES.star) /
    4;

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
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {phase === "interview" && (
            <Badge variant="outline" className="flex items-center gap-2 bg-red-50 text-red-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
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
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
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

            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
                <CardDescription>O que esperar da simulação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3 text-center">
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
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                        {item.step}
                      </div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Fale naturalmente e use exemplos específicos. Lembre-se
                  do formato STAR: Situation, Task, Action, Result.
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
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
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Pergunta {currentQuestion + 1} de {QUESTIONS.length}
                </span>
                <span>{Math.round(progress)}% concluído</span>
              </div>
              <Progress value={progress} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <Card>
                  <CardHeader>
                    <Button size="sm" variant="outline" className="w-fit">
                      <Volume2 className="mr-2 h-4 w-4" />
                      Ouvir pergunta
                    </Button>
                    <CardTitle className="mt-3 text-xl">
                      &quot;{QUESTIONS[currentQuestion].question}&quot;
                    </CardTitle>
                    <CardDescription className="text-sm">
                      💡 {QUESTIONS[currentQuestion].hint}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        className="h-20 w-20 rounded-full bg-orange-500 hover:bg-orange-600"
                        onClick={handleRecord}
                        disabled={isRecording || currentAnswer.length > 0}
                      >
                        <Mic
                          className={`h-10 w-10 text-white ${isRecording ? "animate-pulse" : ""}`}
                        />
                      </Button>
                    </div>
                    {isRecording && (
                      <p className="text-center text-sm text-muted-foreground">
                        🎤 Gravando... Fale naturalmente
                      </p>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou escreva</span>
                      </div>
                    </div>

                    <Textarea
                      value={currentAnswer}
                      onChange={(event) => setCurrentAnswer(event.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[200px]"
                      disabled={isRecording}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {currentAnswer.length} caracteres
                      </span>
                      <Button
                        onClick={handleNext}
                        disabled={!currentAnswer.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {currentQuestion < QUESTIONS.length - 1
                          ? "Próxima pergunta"
                          : "Finalizar entrevista"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="space-y-4 px-4 py-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">Entrevista concluída! 🎉</h2>
                  <p className="text-sm text-green-100">
                    Você completou a simulação. Confira seu feedback detalhado abaixo.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold">{averageScore.toFixed(1)}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <Star
                        key={index}
                        className={`h-6 w-6 ${index <= Math.round(averageScore) ? "fill-yellow-300 text-yellow-300" : "text-white/40"}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rubrica de avaliação</CardTitle>
                <CardDescription>Análise detalhada do seu desempenho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Fluência",
                    score: RUBRIC_SCORES.fluency,
                    description: "Naturalidade e ritmo da fala",
                  },
                  {
                    label: "Vocabulário Técnico",
                    score: RUBRIC_SCORES.vocabulary,
                    description: "Uso apropriado de termos",
                  },
                  {
                    label: "Gramática",
                    score: RUBRIC_SCORES.grammar,
                    description: "Correção gramatical",
                  },
                  {
                    label: "Método STAR",
                    score: RUBRIC_SCORES.star,
                    description: "Estrutura das respostas",
                  },
                ].map((criterion) => (
                  <div key={criterion.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{criterion.label}</p>
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${index <= criterion.score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                            />
                          ))}
                        </div>
                        <span className="w-8 text-sm">{criterion.score}/5</span>
                      </div>
                    </div>
                    <Progress value={(criterion.score / 5) * 100} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback personalizado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 text-sm text-green-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Pontos fortes</p>
                      <ul className="list-disc space-y-1 pl-4">
                        <li>Excelente uso do formato STAR nas respostas</li>
                        <li>Vocabulário técnico apropriado para {profile.track}</li>
                        <li>Respostas bem estruturadas e claras</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 text-sm text-orange-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Oportunidades de melhoria</p>
                      <ul className="list-disc space-y-1 pl-4">
                        <li>Trabalhe em reduzir pausas longas durante a resposta</li>
                        <li>Adicione números e métricas aos seus exemplos</li>
                        <li>Pratique respostas com entonação mais natural</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => {
                  setPhase("intro");
                  setCurrentQuestion(0);
                  setCurrentAnswer("");
                }}
              >
                Tentar novamente
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={onComplete}
              >
                Voltar ao dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
