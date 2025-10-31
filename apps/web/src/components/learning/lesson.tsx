"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Progress,
  RadioGroup,
  RadioGroupItem,
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

interface LessonProps {
  day: number;
  onComplete: () => void;
  onOpenChat: () => void;
}

type LessonPhase =
  | {
      phase: "presentation";
      title: string;
      description: string;
      content: {
        topic: string;
        explanation: string;
        example: string;
        keyPhrases: string[];
      };
    }
  | {
      phase: "assimilation";
      title: string;
      description: string;
      quiz: {
        question: string;
        options: string[];
        correct: number;
      };
    }
  | {
      phase: "recall";
      title: string;
      description: string;
      prompt: string;
    }
  | {
      phase: "feedback";
      title: string;
      description: string;
    };

const LESSON_CONTENT: LessonPhase[] = [
  {
    phase: "presentation",
    title: "📚 Presentation",
    description: "Aprenda novos conceitos e vocabulário",
    content: {
      topic: "Interview Introductions",
      explanation:
        "Em entrevistas técnicas, sua introdução define o tom. Uma abertura forte inclui: seu nome, cargo atual, anos de experiência e principais competências técnicas.",
      example: `"Hi, I'm Maria. I'm a Backend Developer with 3 years of experience. I specialize in Node.js, PostgreSQL, and building RESTful APIs. Most recently, I worked on a microservices architecture that handled 10,000 requests per second."`,
      keyPhrases: [
        "I specialize in...",
        "My experience includes...",
        "I've worked on...",
        "I'm proficient in...",
      ],
    },
  },
  {
    phase: "assimilation",
    title: "🎯 Assimilation",
    description: "Pratique e reforce o que aprendeu",
    quiz: {
      question: "Which phrase best describes technical expertise in an interview?",
      options: [
        "I know a bit about programming",
        "I specialize in backend development with focus on scalability",
        "I can code",
        "I work with computers",
      ],
      correct: 1,
    },
  },
  {
    phase: "recall",
    title: "💡 Active Recall",
    description: "Aplique o conhecimento em um cenário real",
    prompt:
      "Write your own introduction for a Backend Developer position. Include your experience, main technologies, and a recent achievement. (Write in English)",
  },
  {
    phase: "feedback",
    title: "✨ Feedback & Next",
    description: "Revise seu progresso e planeje os próximos passos",
  },
];

export function Lesson({ day, onComplete, onOpenChat }: LessonProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");

  const phase = LESSON_CONTENT[currentPhase];
  const progress = useMemo(
    () => ((currentPhase + 1) / LESSON_CONTENT.length) * 100,
    [currentPhase],
  );

  const canProceed = () => {
    if (phase.phase === "presentation") return true;
    if (phase.phase === "assimilation") return selectedAnswer !== null;
    if (phase.phase === "recall") return userAnswer.trim().length > 20;
    return true;
  };

  const handleNext = () => {
    if (currentPhase === LESSON_CONTENT.length - 1) {
      onComplete();
      return;
    }

    setCurrentPhase((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onComplete}
            className="rounded-full bg-white/70 px-4 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao plano
          </Button>

          <Button onClick={onOpenChat} className={cn("rounded-full px-4", learningPrimaryButton)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversar com Teacher AI
          </Button>
        </header>

        <div className="space-y-2">
          <div className={cn("flex items-center justify-between text-sm", learningMutedText)}>
            <span>
              Dia {day} • {phase.title}
            </span>
            <span>
              {currentPhase + 1} de {LESSON_CONTENT.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/60" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase.phase}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className={cn(learningSurfaceCard)}>
              <CardHeader>
                <CardTitle className={cn(learningSectionHeading)}>{phase.title}</CardTitle>
                <CardDescription className={cn(learningMutedText)}>
                  {phase.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {phase.phase === "presentation" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 text-sm shadow-inner">
                      <h3 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">
                        📖 {phase.content.topic}
                      </h3>
                      <p className={cn("leading-relaxed", learningMutedText)}>
                        {phase.content.explanation}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-sm">
                      <p className="mb-2 font-semibold text-green-700 dark:text-green-300">
                        💬 Exemplo
                      </p>
                      <p className="text-green-700 dark:text-green-200 italic">
                        {phase.content.example}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        🔑 Frases-chave
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {phase.content.keyPhrases.map((phrase) => (
                          <div
                            key={phrase}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm",
                              learningSubtleCard,
                              "font-mono text-blue-600 dark:text-blue-300",
                            )}
                          >
                            {phrase}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {phase.phase === "assimilation" && (
                  <div className="space-y-6">
                    <div className="rounded-xl bg-white/70 p-4 text-sm shadow-inner dark:bg-neutral-900/70">
                      <p className={cn("font-semibold", learningSectionHeading)}>
                        {phase.quiz.question}
                      </p>
                      <p className={cn("text-xs", learningMutedText)}>Escolha a melhor resposta.</p>
                    </div>

                    <RadioGroup
                      value={selectedAnswer !== null ? String(selectedAnswer) : undefined}
                      onValueChange={(value: string) => setSelectedAnswer(Number(value))}
                      className="space-y-3"
                    >
                      {phase.quiz.options.map((option, index) => (
                        <Label
                          key={option}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                            learningSubtleCard,
                            selectedAnswer === index
                              ? "border-blue-500/60 shadow-lg shadow-blue-500/15"
                              : "hover:shadow-md hover:shadow-blue-500/10",
                          )}
                        >
                          <RadioGroupItem value={String(index)} />
                          {option}
                        </Label>
                      ))}
                    </RadioGroup>

                    {showFeedback && selectedAnswer !== null && (
                      <div
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm",
                          selectedAnswer === phase.quiz.correct
                            ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200"
                            : "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-200",
                        )}
                      >
                        {selectedAnswer === phase.quiz.correct ? (
                          <span>
                            Excelente! Essa é a melhor forma de demonstrar sua experiência.
                          </span>
                        ) : (
                          <span>
                            Quase lá! Foque em evidenciar impacto e habilidades específicas.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {phase.phase === "recall" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 text-sm">
                      <p className={cn("font-semibold", learningSectionHeading)}>{phase.prompt}</p>
                      <p className={cn("text-xs", learningMutedText)}>
                        Escreva pelo menos 3 frases completas.
                      </p>
                    </div>
                    <Textarea
                      value={userAnswer}
                      onChange={(event) => setUserAnswer(event.target.value)}
                      rows={6}
                      placeholder="Ex: Hi, I'm..."
                      className="resize-none rounded-2xl border border-blue-500/30 bg-white/80 shadow-inner focus-visible:border-blue-500 focus-visible:ring-blue-500 dark:bg-neutral-900/70"
                    />
                  </div>
                )}

                {phase.phase === "feedback" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 p-4 text-sm shadow-inner">
                      <p className={cn("font-semibold", learningSectionHeading)}>🏁 Parabéns!</p>
                      <p className={cn("text-sm", learningMutedText)}>
                        Você concluiu esta lição. Revise seu progresso com Teacher AI para obter
                        feedback personalizado.
                      </p>
                    </div>
                    <Button className={cn("w-full", learningPrimaryButton)} onClick={onOpenChat}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Pedir feedback ao Teacher AI
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={onComplete}
            className="rounded-full border-transparent bg-white/70 px-4 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            {phase.phase === "assimilation" && selectedAnswer !== null && (
              <Button
                variant="ghost"
                onClick={() => setShowFeedback(true)}
                className="rounded-full bg-white/60 px-4 text-blue-600 hover:bg-white/80 dark:bg-neutral-800/60 dark:text-blue-300"
              >
                Ver feedback
              </Button>
            )}
            <Button
              disabled={!canProceed()}
              onClick={handleNext}
              className={cn(
                "rounded-full px-6",
                canProceed()
                  ? learningPrimaryButton
                  : "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500",
              )}
            >
              {currentPhase === LESSON_CONTENT.length - 1 ? (
                <>
                  Concluir <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
