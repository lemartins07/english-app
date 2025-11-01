import { useEffect, useState } from "react";

import type {
  FinalizeAssessmentResult,
  SubmitListeningResponseInput,
  SubmitMultipleChoiceResponseInput,
  SubmitSpeakingResponseInput,
} from "@english-app/application";
import type { AssessmentQuestion } from "@english-app/domain";

interface AssessmentState {
  sessionId: string | null;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  isLoading: boolean;
  error: Error | null;
  result: FinalizeAssessmentResult | null;
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>({
    sessionId: null,
    questions: [],
    currentQuestionIndex: 0,
    isLoading: false,
    error: null,
    result: null,
  });

  useEffect(() => {
    async function startAssessment() {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch("/api/assessment/start", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to start assessment");
        }
        const { sessionId, session } = await response.json();
        setState((prev) => ({
          ...prev,
          sessionId,
          questions: session.questions,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
      }
    }

    startAssessment();
  }, []);

  async function submitAnswer(
    answer: Omit<
      | SubmitListeningResponseInput
      | SubmitMultipleChoiceResponseInput
      | SubmitSpeakingResponseInput,
      "sessionId" | "questionId"
    >,
  ) {
    if (!state.sessionId) return;

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          questionId: state.questions[state.currentQuestionIndex].id,
          ...answer,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }
      // Move to the next question or finalize
      if (state.currentQuestionIndex < state.questions.length - 1) {
        setState((prev) => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          isLoading: false,
        }));
      } else {
        finalizeAssessment();
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
    }
  }

  async function finalizeAssessment() {
    if (!state.sessionId) return;

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/assessment/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });
      if (!response.ok) {
        throw new Error("Failed to finalize assessment");
      }
      const result = await response.json();
      setState((prev) => ({ ...prev, result, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
    }
  }

  return { ...state, submitAnswer };
}
