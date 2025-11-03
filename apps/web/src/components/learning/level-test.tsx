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
  submissionState?: "idle" | "submitting" | "completed" | "error";
}

type AnswerToSubmit =
  | Omit<SubmitListeningResponseInput, "sessionId" | "questionId">
  | Omit<SubmitMultipleChoiceResponseInput, "sessionId" | "questionId">
  | Omit<SubmitSpeakingResponseInput, "sessionId" | "questionId">;

export function LevelTest({ onComplete, submissionState = "idle" }: LevelTestProps) {
  const {
    questions,

    currentQuestionIndex,

    isLoading,

    error,

    submitAnswer,

    result,
    answeredQuestionIds,
  } = useAssessment();

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    elapsedMs,
    error: recordingError,
    hasRecording,
  } = useAudioRecorder();

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const question = questions[currentQuestionIndex];

  const selectedIndex = selectedAnswer !== "" ? Number(selectedAnswer) : null;
  const answeredCount = answeredQuestionIds.length;

  const progress = useMemo(
    () => (questions.length ? (answeredCount / questions.length) * 100 : 0),
    [answeredCount, questions.length],
  );

  const canProceed =
    question?.type === "speaking"
      ? hasRecording && !isRecording && submissionState !== "submitting"
      : selectedIndex !== null;

  const blobToDataUrl = async (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Não foi possível preparar o áudio para envio."));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o áudio gravado."));
      reader.readAsDataURL(blob);
    });

  const handleNext = async () => {
    if (!question || submissionState === "submitting") return;

    let answerToSubmit: AnswerToSubmit | null = null;

    if (question.type === "speaking") {
      if (audioBlob) {
        const audioUri = await blobToDataUrl(audioBlob);

        answerToSubmit = {
          type: "speaking",
          audio: { uri: audioUri },
          submittedAt: new Date().toISOString(),
        };
      }
    } else if (selectedIndex !== null && "options" in question && question.options) {
      answerToSubmit = {
        type: question.type,

        selectedOptionIds: [question.options[selectedIndex].id],

        submittedAt: new Date().toISOString(),
      };
    }

    if (answerToSubmit) {
      await submitAnswer(answerToSubmit);

      setSelectedAnswer("");

      if (hasRecording || isRecording) {
        stopRecording();
      }
    }
  };

  const handleRecord = () => {
    if (submissionState === "submitting") {
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  if (isLoading && !question) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-100">
        <p className="text-sm font-medium">Ops! Algo deu errado.</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!question) {
    if (result) {
      onComplete(result.recommendedLevel);
    }

    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-blue-400/40 bg-blue-500/10 p-8 text-center text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100">
        <p className="text-sm">Processando seu resultado personalizado...</p>
      </div>
    );
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
                  {question.type === "multipleChoice" && "📝 Questão de múltipla escolha"}

                  {question.type === "listening" && "🎧 Compreensão auditiva"}

                  {question.type === "speaking" && "🎤 Produção oral"}
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
                      value={selectedAnswer}
                      onValueChange={(value: string) => setSelectedAnswer(value)}
                      className="space-y-3"
                    >
                      {question.options.map((option: MultipleChoiceOption, index: number) => (
                        <div
                          key={option.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 transition",

                            learningSubtleCard,

                            selectedIndex === index
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

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-900 dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-100">
                        {isRecording ? (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium">
                              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                              Gravando…
                            </span>
                            <span className="text-xs">
                              {Math.floor(elapsedMs / 1000)
                                .toString()
                                .padStart(2, "0")}{" "}
                              s
                            </span>
                          </div>
                        ) : hasRecording ? (
                          <span className="font-medium">
                            Resposta gravada! Você pode seguir para a próxima etapa.
                          </span>
                        ) : (
                          <span className="font-medium">
                            Toque em “Gravar resposta” para começar. Você pode refazer quantas vezes
                            quiser.
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="lg"
                          onClick={handleRecord}
                          className={cn(
                            "flex-1 rounded-full",
                            isRecording
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : learningPrimaryButton,
                          )}
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          {isRecording
                            ? "Parar gravação"
                            : hasRecording
                              ? "Regravar resposta"
                              : "Gravar resposta"}
                        </Button>

                        <Button
                          size="lg"
                          variant="outline"
                          onClick={stopRecording}
                          disabled={!isRecording}
                          className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-200 dark:hover:bg-red-900/20"
                        >
                          Cancelar
                        </Button>
                      </div>

                      {recordingError ? (
                        <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-200">
                          {recordingError.message}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className={cn("text-xs", learningMutedText)}>
            Questões adaptadas ao seu objetivo
          </span>

          <Button
            disabled={!canProceed || isLoading || submissionState === "submitting"}
            onClick={handleNext}
            className={cn(
              "rounded-full px-6",
              canProceed && submissionState !== "submitting"
                ? learningPrimaryButton
                : "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500",
            )}
          >
            {submissionState === "submitting" ? (
              "Enviando resposta…"
            ) : currentQuestionIndex === questions.length - 1 ? (
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
