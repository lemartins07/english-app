import { useCallback, useEffect, useState } from "react";

import type {
  FinalizeAssessmentResult,
  SubmitListeningResponseInput,
  SubmitMultipleChoiceResponseInput,
  SubmitSpeakingResponseInput,
} from "@english-app/application";
import type { AssessmentQuestion, AssessmentResponse } from "@english-app/domain";

interface AssessmentState {
  sessionId: string | null;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  isLoading: boolean;
  error: Error | null;
  result: FinalizeAssessmentResult | null;
  answeredQuestionIds: string[];
}

function extractAnsweredQuestionIds(responses: AssessmentResponse[] | undefined): string[] {
  if (!Array.isArray(responses)) {
    return [];
  }

  const uniqueIds = new Set<string>();
  responses.forEach((response) => {
    if (response?.questionId) {
      uniqueIds.add(response.questionId);
    }
  });

  return Array.from(uniqueIds);
}

function resolveNextQuestionIndex(
  questions: AssessmentQuestion[],
  answeredQuestionIds: string[],
): number {
  const answeredSet = new Set(answeredQuestionIds);
  const nextIndex = questions.findIndex((question) => !answeredSet.has(question.id));
  return nextIndex === -1 ? questions.length : nextIndex;
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>({
    sessionId: null,
    questions: [],
    currentQuestionIndex: 0,
    isLoading: false,
    error: null,
    result: null,
    answeredQuestionIds: [],
  });

  const finalizeAssessment = useCallback(
    async (sessionIdParam?: string) => {
      const activeSessionId = sessionIdParam ?? state.sessionId;
      if (!activeSessionId) return;

      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch("/api/assessment/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSessionId }),
        });
        if (!response.ok) {
          throw new Error("Não foi possível finalizar o teste de nivelamento.");
        }
        const result = await response.json();
        setState((prev) => ({ ...prev, result, isLoading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
      }
    },
    [state.sessionId],
  );

  useEffect(() => {
    async function startAssessment() {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch("/api/assessment/start", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to start assessment");
        }
        const payload = await response.json();
        if (
          typeof payload?.sessionId !== "string" ||
          !payload.session ||
          !Array.isArray(payload.session.questions)
        ) {
          throw new Error("Não foi possível iniciar o teste de nivelamento.");
        }

        const answeredQuestionIds = extractAnsweredQuestionIds(payload.session.responses);
        const nextQuestionIndex = resolveNextQuestionIndex(
          payload.session.questions,
          answeredQuestionIds,
        );

        setState((prev) => ({
          ...prev,
          sessionId: payload.sessionId,
          questions: payload.session.questions,
          answeredQuestionIds,
          currentQuestionIndex: nextQuestionIndex,
          error: null,
          isLoading: false,
        }));

        if (nextQuestionIndex >= payload.session.questions.length) {
          void finalizeAssessment(payload.sessionId);
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
      }
    }

    startAssessment();
  }, [finalizeAssessment]);

  async function submitAnswer(
    answer: Omit<
      | SubmitListeningResponseInput
      | SubmitMultipleChoiceResponseInput
      | SubmitSpeakingResponseInput,
      "sessionId" | "questionId"
    >,
  ) {
    const { sessionId, questions, currentQuestionIndex } = state;
    if (!sessionId) return;

    const currentQuestion = questions[currentQuestionIndex] ?? null;
    if (!currentQuestion) {
      setState((prev) => ({
        ...prev,
        error: new Error("Não encontramos novas questões para este teste."),
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          ...answer,
        }),
      });
      if (!response.ok) {
        throw new Error("Não foi possível registrar sua resposta. Tente novamente.");
      }
      const updatedAnsweredIds = Array.from(
        new Set([...state.answeredQuestionIds, currentQuestion.id]),
      );
      const nextQuestionIndex = resolveNextQuestionIndex(questions, updatedAnsweredIds);
      const hasPendingQuestions = nextQuestionIndex < questions.length;

      setState((prev) => ({
        ...prev,
        answeredQuestionIds: updatedAnsweredIds,
        currentQuestionIndex: nextQuestionIndex,
        isLoading: !hasPendingQuestions,
      }));

      if (!hasPendingQuestions) {
        await finalizeAssessment(sessionId);
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
    }
  }

  return { ...state, submitAnswer };
}
