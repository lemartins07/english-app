import { describe, expect, it, vi } from "vitest";

import {
  type ChatReply,
  type ChatReplyInput,
  createLLMProviderAdapter,
  type EvaluateAnswerInput,
  type EvaluateAnswerResult,
  type GeneratePlanInput,
  type GeneratePlanResult,
  type InterviewRubricEvalInput,
  type InterviewRubricEvalResult,
  type LLMClient,
  LLMClientError,
} from "..";

function createStubClient(): LLMClient {
  return {
    generatePlan: async (input: GeneratePlanInput): Promise<GeneratePlanResult> => ({
      overview: "overview",
      rationale: "rationale",
      metrics: {
        totalMinutes: 120,
        estimatedCompletionWeeks: input.timeframeWeeks,
      },
      weeks: [
        {
          week: 1,
          theme: "Focus",
          objectives: ["objective"],
          lessons: [
            {
              id: "lesson-1",
              title: "Lesson 1",
              objective: "objective",
              summary: "summary",
              activities: [
                {
                  type: "listening",
                  description: "desc",
                  durationMinutes: 30,
                },
              ],
            },
          ],
        },
      ],
    }),
    evaluateAnswer: async (input: EvaluateAnswerInput): Promise<EvaluateAnswerResult> => {
      const normalized = input.answer.trim();
      return {
        overallScore: normalized.length > 0 ? 0.75 : 0.5,
        strengths: ["fluency"],
        improvements: ["grammar"],
        grade: normalized.length > 0 ? "B" : "C",
        issues: [
          {
            type: "grammar",
            message: "Minor tense mismatch",
          },
        ],
      };
    },
    interviewRubricEval: async (
      input: InterviewRubricEvalInput,
    ): Promise<InterviewRubricEvalResult> => ({
      overallScore: 0.8,
      summary: "Strong communication skills.",
      criteria: input.rubric.map((criterion) => ({
        criterionId: criterion.id,
        score: 0.8,
        evidence: "Clear examples provided.",
      })),
    }),
    chatReply: async (input: ChatReplyInput): Promise<ChatReply> => ({
      message: {
        role: "assistant",
        content: `Responding to ${input.messages.at(-1)?.content}`,
      },
      usage: {
        promptTokens: 12,
        completionTokens: 24,
        totalTokens: 36,
      },
    }),
  };
}

describe("LLM provider adapter contract", () => {
  it("delegates to the underlying client for all methods", async () => {
    const client = createStubClient();
    const adapter = createLLMProviderAdapter(client, { defaultTimeoutMs: 1000 });

    const plan = await adapter.generatePlan({
      learner: {
        level: "B1",
        goals: ["fluency"],
      },
      timeframeWeeks: 4,
    });
    expect(plan.overview).toBe("overview");

    const evaluation = await adapter.evaluateAnswer({
      question: "Why do you want this job?",
      answer: "I enjoy building products.",
      evaluationCriteria: [
        {
          id: "clarity",
          description: "Clarity",
        },
      ],
    });
    expect(evaluation.grade).toBe("B");

    const rubric = await adapter.interviewRubricEval({
      transcript: "Candidate provided structured answer.",
      rubric: [
        {
          id: "communication",
          title: "Communication",
          description: "Evaluate clarity.",
        },
      ],
    });
    expect(rubric.criteria).toHaveLength(1);

    const reply = await adapter.chatReply({
      messages: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    });
    expect(reply.message.role).toBe("assistant");
  });

  it("throws a timeout error when the client does not respond in time", async () => {
    vi.useFakeTimers();
    try {
      const abortingClient: LLMClient = {
        generatePlan: (_input, options) =>
          new Promise((_resolve, reject) => {
            const error = new Error("aborted");
            error.name = "AbortError";
            options?.signal?.addEventListener("abort", () => reject(error));
          }),
        evaluateAnswer: createStubClient().evaluateAnswer,
        interviewRubricEval: createStubClient().interviewRubricEval,
        chatReply: createStubClient().chatReply,
      };

      const adapter = createLLMProviderAdapter(abortingClient, { defaultTimeoutMs: 50 });

      const pending = adapter.generatePlan(
        {
          learner: {
            level: "B2",
            goals: ["listening"],
          },
          timeframeWeeks: 6,
        },
        { timeoutMs: 10 },
      );

      const expectation = expect(pending).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(20);

      await expectation;
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps client errors to provider errors", async () => {
    const failingClient: LLMClient = {
      ...createStubClient(),
      evaluateAnswer: () => {
        throw new LLMClientError({
          message: "Rate limited",
          status: 429,
          code: "rate_limit_exceeded",
        });
      },
    };

    const adapter = createLLMProviderAdapter(failingClient);

    await expect(
      adapter.evaluateAnswer({
        question: "Explain polymorphism",
        answer: "It is the ability of objects to take many forms.",
        evaluationCriteria: [{ id: "correctness", description: "Correctness" }],
      }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("respects caller supplied abort signal", async () => {
    const abortAwareClient: LLMClient = {
      generatePlan: (_input, options) =>
        new Promise((_resolve, reject) => {
          const abortErr = new Error("cancelled");
          abortErr.name = "AbortError";
          options?.signal?.addEventListener("abort", () => reject(abortErr));
        }),
      evaluateAnswer: createStubClient().evaluateAnswer,
      interviewRubricEval: createStubClient().interviewRubricEval,
      chatReply: createStubClient().chatReply,
    };

    const adapter = createLLMProviderAdapter(abortAwareClient, { defaultTimeoutMs: 500 });

    const controller = new AbortController();
    const promise = adapter.generatePlan(
      {
        learner: { level: "C1", goals: ["speaking"] },
        timeframeWeeks: 8,
      },
      { signal: controller.signal },
    );

    controller.abort();

    await expect(promise).rejects.toMatchObject({ code: "CANCELLED" });
  });

  it("wraps unexpected errors as unknown provider errors", async () => {
    const clientWithUnexpectedFailure: LLMClient = {
      ...createStubClient(),
      chatReply: () => {
        throw new Error("boom");
      },
    };

    const adapter = createLLMProviderAdapter(clientWithUnexpectedFailure);

    await expect(
      adapter.chatReply({
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toMatchObject({ code: "UNKNOWN" });
  });
});
