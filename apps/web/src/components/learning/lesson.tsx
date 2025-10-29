"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

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
    description: "Learn new concepts and vocabulary",
    content: {
      topic: "Interview Introductions",
      explanation:
        "In technical interviews, your introduction sets the tone. A strong opening includes: your name, current role, years of experience, and key technical skills.",
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
    description: "Practice and reinforce what you learned",
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
    description: "Apply your knowledge in a real scenario",
    prompt:
      "Write your own introduction for a Backend Developer position. Include your experience, main technologies, and a recent achievement. (Write in English)",
  },
  {
    phase: "feedback",
    title: "✨ Feedback & Next",
    description: "Review your progress and plan ahead",
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
          <Button variant="ghost" onClick={onComplete}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao plano
          </Button>

          <Button variant="outline" onClick={onOpenChat}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Teacher AI
          </Button>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Dia {day} • {phase.title}
            </span>
            <span>
              {currentPhase + 1} de {LESSON_CONTENT.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase.phase}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{phase.title}</CardTitle>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {phase.phase === "presentation" && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm">
                      <h3 className="mb-2 font-semibold text-blue-900">📖 {phase.content.topic}</h3>
                      <p className="text-muted-foreground">{phase.content.explanation}</p>
                    </div>

                    <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 text-sm">
                      <p className="mb-2 font-semibold text-green-900">💬 Exemplo</p>
                      <p className="text-green-800 italic">{phase.content.example}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-900">🔑 Frases-chave</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {phase.content.keyPhrases.map((phrase) => (
                          <div
                            key={phrase}
                            className="rounded-lg border bg-white p-3 text-sm text-blue-700"
                          >
                            <code>{phrase}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {phase.phase === "assimilation" && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                      {phase.quiz.question}
                    </div>

                    <RadioGroup
                      value={selectedAnswer?.toString()}
                      onValueChange={(value) => {
                        setSelectedAnswer(Number(value));
                        setShowFeedback(false);
                      }}
                      className="space-y-3"
                    >
                      {phase.quiz.options.map((option, index) => (
                        <div key={option} className="flex items-center gap-3">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label
                            htmlFor={`option-${index}`}
                            className={[
                              "flex-1 cursor-pointer rounded-lg border p-3 transition",
                              showFeedback && index === phase.quiz.correct
                                ? "border-green-500 bg-green-50"
                                : showFeedback && index === selectedAnswer
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-border hover:border-blue-200 hover:bg-blue-50",
                            ].join(" ")}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {showFeedback && selectedAnswer !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={[
                          "rounded-lg p-4 text-sm",
                          selectedAnswer === phase.quiz.correct
                            ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-orange-200 bg-orange-50 text-orange-700",
                        ].join(" ")}
                      >
                        {selectedAnswer === phase.quiz.correct ? (
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-semibold">✅ Correto!</p>
                              <p>Essa resposta demonstra especificidade e profissionalismo.</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold">💭 Não exatamente.</p>
                            <p>
                              A melhor resposta é:{" "}
                              <span className="font-medium text-orange-900">
                                &ldquo;{phase.quiz.options[phase.quiz.correct]}&rdquo;
                              </span>
                              . Em entrevistas, seja específico sobre suas habilidades.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {!showFeedback && selectedAnswer !== null ? (
                      <Button onClick={() => setShowFeedback(true)} className="w-full">
                        Verificar resposta
                      </Button>
                    ) : null}
                  </div>
                )}

                {phase.phase === "recall" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 text-sm text-orange-900">
                      {phase.prompt}
                    </div>
                    <Textarea
                      value={userAnswer}
                      onChange={(event) => setUserAnswer(event.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[200px]"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{userAnswer.length} caracteres</span>
                      <span>Mínimo de 20 caracteres</span>
                    </div>

                    {userAnswer.length > 20 && (
                      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                        <div className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-blue-900">💡 Teacher AI Tip</p>
                            <p>
                              Ótimo! Sua resposta mostra estrutura. Considere adicionar um número
                              específico para maior impacto.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {phase.phase === "feedback" && (
                  <div className="space-y-4 text-center py-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">🎉 Lição concluída!</h3>
                      <p className="text-sm text-muted-foreground">
                        Você completou o Dia {day} com sucesso. Continue praticando para manter o
                        progresso!
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {[
                        { label: "Pontos", value: "100" },
                        { label: "Minutos", value: "15" },
                        { label: "Streak", value: "🔥" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-muted p-3">
                          <div className="text-2xl font-semibold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" onClick={onOpenChat}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Praticar com Teacher AI
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPhase((prev) => Math.max(0, prev - 1))}
                    disabled={currentPhase === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentPhase === LESSON_CONTENT.length - 1 ? "Concluir lição" : "Próximo"}
                    <ArrowRight className="ml-2 h-4 w-4" />
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
