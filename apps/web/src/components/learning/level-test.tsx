"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Mic, Volume2 } from "lucide-react";

import type {
  SubmitListeningResponseInput,
  SubmitMultipleChoiceResponseInput,
  SubmitSpeakingResponseInput,
} from "@english-app/application";
import type { MultipleChoiceOption } from "@english-app/domain";
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

import { useAssessment } from "@/hooks/use-assessment";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { cn } from "@/lib/utils";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";

interface LevelTestProps {
  onComplete: (level: string) => void;
}

type AnswerToSubmit =
  | Omit<SubmitListeningResponseInput, "sessionId" | "questionId">
  | Omit<SubmitMultipleChoiceResponseInput, "sessionId" | "questionId">
  | Omit<SubmitSpeakingResponseInput, "sessionId" | "questionId">;

export function LevelTest({ onComplete }: LevelTestProps) {
  const {
    questions,

    currentQuestionIndex,

    isLoading,

    error,

    submitAnswer,

    result,
  } = useAssessment();

  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [hasRecorded, setHasRecorded] = useState(false);

  const question = questions[currentQuestionIndex];

  const progress = useMemo(
    () => ((currentQuestionIndex + 1) / (questions.length || 1)) * 100,

    [currentQuestionIndex, questions.length],
  );

  const canProceed = question?.type === "speaking" ? hasRecorded : selectedAnswer !== null;

  const handleNext = async () => {
    if (!question) return;

    let answerToSubmit: AnswerToSubmit | null = null;

    if (question.type === "speaking") {
      if (audioBlob) {
        // TODO: Implement actual audio upload and get the URI

        const audioUri = `fake-audio-uri/${new Date().getTime()}.wav`;

        answerToSubmit = {
          type: "speaking",
          audio: { uri: audioUri },
          submittedAt: new Date().toISOString(),
        };
      }
    } else if (selectedAnswer !== null && "options" in question && question.options) {
      answerToSubmit = {
        type: question.type,

        selectedOptionIds: [question.options[selectedAnswer].id],

        submittedAt: new Date().toISOString(),
      };
    }

    if (answerToSubmit) {
      await submitAnswer(answerToSubmit);

      setSelectedAnswer(null);

      setHasRecorded(false);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();

      setHasRecorded(true);
    } else {
      startRecording();
    }
  };

  if (isLoading && !question) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!question) {
    if (result) {
      onComplete(result.recommendedLevel);

      return <div>Assessment complete! Your level is: {result.recommendedLevel}</div>;
    }

    return <div>Assessment complete!</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2">
          <div className={cn("flex items-center justify-between text-sm", learningMutedText)}>
            <span>Teste de Nivelamento</span>

            <span>
              {currentQuestionIndex + 1} de {questions.length}
            </span>
          </div>

          <Progress value={progress} className="h-2 bg-white/60" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className={cn(learningSurfaceCard)}>
              <CardHeader>
                <CardTitle className={cn(learningSectionHeading)}>
                  {question.type === "multipleChoice" && "📝 Multiple Choice"}

                  {question.type === "listening" && "🎧 Listening"}

                  {question.type === "speaking" && "🎤 Speaking"}
                </CardTitle>

                <CardDescription className={cn(learningMutedText)}>
                  {"stem" in question
                    ? question.stem
                    : (question.prompt as { instruction: string }).instruction}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {question.type === "listening" && "stimulus" in question && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-300"
                    >
                      <Volume2 className="mr-2 h-4 w-4" />
                      Ouvir
                    </Button>

                    <span className={cn("text-xs", learningMutedText)}>
                      {question.stimulus.audioUrl}
                    </span>
                  </div>
                )}

                {(question.type === "multipleChoice" || question.type === "listening") &&
                  "options" in question &&
                  question.options && (
                    <RadioGroup
                      value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
                      onValueChange={(value: string) => setSelectedAnswer(Number(value))}
                      className="space-y-3"
                    >
                      {question.options.map((option: MultipleChoiceOption, index: number) => (
                        <div
                          key={option.id}
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
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                {question.type === "speaking" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 text-sm shadow-inner">
                      <p className={cn("font-semibold", learningSectionHeading)}>
                        🎤{" "}
                        {typeof question.prompt === "string"
                          ? question.prompt
                          : (question.prompt as { instruction: string }).instruction}
                      </p>

                      {typeof question.prompt !== "string" &&
                      (question.prompt as { context: string }).context ? (
                        <p className={cn("text-xs", learningMutedText)}>
                          {(question.prompt as { context: string }).context}
                        </p>
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
            disabled={!canProceed || isLoading}
            onClick={handleNext}
            className={cn(
              "rounded-full px-6",

              canProceed
                ? learningPrimaryButton
                : "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500",
            )}
          >
            {currentQuestionIndex === questions.length - 1 ? (
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
