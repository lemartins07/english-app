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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Teste de Nivelamento</span>
            <span>
              {currentQuestion + 1} de {QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {question.type === "mcq" && "📝 Multiple Choice"}
                  {question.type === "listening" && "🎧 Listening"}
                  {question.type === "speaking" && "🎤 Speaking"}
                </CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {question.type === "listening" && "audio" in question && (
                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 text-sm">
                    <Button size="sm" variant="outline">
                      <Volume2 className="mr-2 h-4 w-4" />
                      Ouvir
                    </Button>
                    <span className="text-muted-foreground">{question.audio}</span>
                  </div>
                )}

                {(question.type === "mcq" || question.type === "listening") &&
                  "options" in question && (
                    <RadioGroup
                      value={selectedAnswer?.toString()}
                      onValueChange={(value: string) => setSelectedAnswer(Number(value))}
                    >
                      <div className="space-y-3">
                        {question.options.map((option, index) => (
                          <div
                            key={option}
                            className="flex items-center gap-3 rounded-lg border border-transparent p-3 hover:border-blue-200 hover:bg-blue-50"
                          >
                            <RadioGroupItem value={index.toString()} id={`question-${index}`} />
                            <Label
                              htmlFor={`question-${index}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                {question.type === "speaking" && (
                  <div className="space-y-5 py-6 text-center">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleRecord}
                        disabled={isRecording || hasRecorded}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600"
                      >
                        {hasRecorded ? (
                          <CheckCircle2 className="h-12 w-12" />
                        ) : (
                          <Mic className={`h-12 w-12 ${isRecording ? "animate-pulse" : ""}`} />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRecording && "Gravando... Fale naturalmente"}
                      {hasRecorded && "Gravação concluída! ✅"}
                      {!isRecording && !hasRecorded && "Clique para gravar sua resposta"}
                    </p>
                    {"hint" in question && question.hint ? (
                      <p className="text-xs text-muted-foreground">{question.hint}</p>
                    ) : null}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentQuestion < QUESTIONS.length - 1 ? "Próxima" : "Finalizar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
