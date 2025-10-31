"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Mic, Volume2 } from "lucide-react";

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
} from "@english-app/ui";

import { cn } from "@/lib/utils";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";

type Question =
  | {
      type: "mcq" | "listening";
      question: string;
      options: string[];
      correct: number;
      audio?: string;
    }
  | {
      type: "speaking";
      question: string;
      hint?: string;
    };

const QUESTIONS: Question[] = [
  {
    type: "mcq",
    question: 'Complete: "I ____ working on this project for two months."',
    options: ["am", "have been", "was", "will be"],
    correct: 1,
  },
  {
    type: "mcq",
    question: "Choose the correct sentence:",
    options: [
      "She dont like coffee",
      "She doesnt likes coffee",
      "She doesn't like coffee",
      "She don't likes coffee",
    ],
    correct: 2,
  },
  {
    type: "listening",
    question: "Listen to the audio and choose what you heard:",
    audio: 'Sample audio: "I implemented a new feature using React hooks"',
    options: [
      "I implemented a new feature using React hooks",
      "I implemented a new function using React hooks",
      "I implemented a new feature using Redux hooks",
      "I implemented a new future using React hooks",
    ],
    correct: 0,
  },
  {
    type: "mcq",
    question: 'What does "API" stand for in software development?',
    options: [
      "Application Programming Interface",
      "Advanced Programming Integration",
      "Automated Process Interface",
      "Application Process Integration",
    ],
    correct: 0,
  },
  {
    type: "speaking",
    question: 'Record a short answer: "Tell me about your experience with programming languages."',
    hint: "Speak for 20-30 seconds",
  },
];

interface LevelTestProps {
  onComplete: (level: string) => void;
}

export function LevelTest({ onComplete }: LevelTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const question = QUESTIONS[currentQuestion];
  const progress = useMemo(
    () => ((currentQuestion + 1) / QUESTIONS.length) * 100,
    [currentQuestion],
  );

  const canProceed = question.type === "speaking" ? hasRecorded : selectedAnswer !== null;

  const handleNext = () => {
    if (question.type === "speaking") {
      setAnswers((prev) => [...prev, 1]);
    } else if (selectedAnswer !== null) {
      setAnswers((prev) => [...prev, selectedAnswer]);
    }

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasRecorded(false);
      return;
    }

    const correctCount = answers.reduce((total, answer, index) => {
      const q = QUESTIONS[index];
      if (q.type === "speaking") {
        return total;
      }
      return total + (answer === q.correct ? 1 : 0);
    }, 0);

    let level = "A2";
    if (correctCount >= 3) level = "B1";
    if (correctCount >= 4) level = "B2";

    onComplete(level);
  };

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setHasRecorded(true);
    }, 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2">
          <div className={cn("flex items-center justify-between text-sm", learningMutedText)}>
            <span>Teste de Nivelamento</span>
            <span>
              {currentQuestion + 1} de {QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/60" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className={cn(learningSurfaceCard)}>
              <CardHeader>
                <CardTitle className={cn(learningSectionHeading)}>
                  {question.type === "mcq" && "📝 Multiple Choice"}
                  {question.type === "listening" && "🎧 Listening"}
                  {question.type === "speaking" && "🎤 Speaking"}
                </CardTitle>
                <CardDescription className={cn(learningMutedText)}>
                  {question.question}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {question.type === "listening" && "audio" in question && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-300"
                    >
                      <Volume2 className="mr-2 h-4 w-4" />
                      Ouvir
                    </Button>
                    <span className={cn("text-xs", learningMutedText)}>{question.audio}</span>
                  </div>
                )}

                {(question.type === "mcq" || question.type === "listening") &&
                  "options" in question && (
                    <RadioGroup
                      value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
                      onValueChange={(value: string) => setSelectedAnswer(Number(value))}
                      className="space-y-3"
                    >
                      {question.options.map((option, index) => (
                        <div
                          key={option}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                            learningSubtleCard,
                            selectedAnswer === index
                              ? "border-blue-500/60 shadow-lg shadow-blue-500/15"
                              : "hover:shadow-md hover:shadow-blue-500/10",
                          )}
                        >
                          <RadioGroupItem value={index.toString()} id={`question-${index}`} />
                          <Label
                            htmlFor={`question-${index}`}
                            className={cn("flex-1 cursor-pointer text-sm", learningSectionHeading)}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                {question.type === "speaking" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 text-sm shadow-inner">
                      <p className={cn("font-semibold", learningSectionHeading)}>
                        🎤 {question.question}
                      </p>
                      {question.hint ? (
                        <p className={cn("text-xs", learningMutedText)}>{question.hint}</p>
                      ) : null}
                    </div>

                    <Button
                      size="lg"
                      onClick={handleRecord}
                      disabled={isRecording}
                      className={cn(
                        "w-full rounded-full",
                        isRecording
                          ? "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500"
                          : learningPrimaryButton,
                      )}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      {isRecording ? "Gravando..." : "Gravar resposta"}
                    </Button>

                    {hasRecorded && (
                      <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-200">
                        Resposta gravada! Podemos avançar.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <span className={cn("text-xs", learningMutedText)}>
            Questões adaptadas ao seu objetivo
          </span>
          <Button
            disabled={!canProceed}
            onClick={handleNext}
            className={cn(
              "rounded-full px-6",
              canProceed
                ? learningPrimaryButton
                : "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500",
            )}
          >
            {currentQuestion === QUESTIONS.length - 1 ? (
              <>
                Finalizar <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Próximo <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
