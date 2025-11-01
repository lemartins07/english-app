import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TranscribeShortAudioResult } from "@english-app/adapters/asr/types";
import type {
  AssessmentBlueprint,
  AssessmentBlueprintProvider,
  AssessmentSessionRepository,
  CreateAssessmentSessionInput,
  FinalizeAssessmentInput,
  InterviewRubricEvalInput,
  InterviewRubricEvalResult,
  RetentionEventEmitter,
  SaveUserInput,
  StartAssessmentInput,
  SubmitAssessmentResponseInput,
  TranscribeSpeakingAudioUseCase,
  UseCase,
  UserRepository,
} from "@english-app/application";
import {
  FinalizeAssessmentUseCase,
  StartAssessmentUseCase,
  SubmitAssessmentResponseUseCase,
} from "@english-app/application";
import type { UserEntity } from "@english-app/domain";
import {
  type AssessmentDiagnostic,
  type AssessmentResponse,
  type AssessmentSession,
  type CEFRLevel,
  createAssessmentCriterion,
  createListeningQuestion,
  createMultipleChoiceQuestion,
  createSpeakingQuestion,
} from "@english-app/domain";

class InMemoryRetentionEventEmitter implements RetentionEventEmitter {
  public events: { name: string; payload?: Record<string, unknown> }[] = [];

  emit(
    event: Parameters<RetentionEventEmitter["emit"]>[0],
    payload?: Record<string, unknown>,
  ): void {
    this.events.push({ name: event, payload });
  }
}

interface StoredSessionState {
  session: StoredSession;
  responses: AssessmentResponse[];
  diagnostic?: AssessmentDiagnostic;
}

interface StoredSession {
  id: string;
  userId: string;
  blueprintId: string;
  status: AssessmentSession["status"];
  targetLevel?: CEFRLevel;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

class InMemoryAssessmentSessionRepository implements AssessmentSessionRepository {
  private store = new Map<string, StoredSessionState>();

  async findById(sessionId: string) {
    const record = this.store.get(sessionId);
    if (!record) {
      return null;
    }

    return {
      session: record.session,
      responses: record.responses,
      diagnostic: record.diagnostic,
    };
  }

  async findActiveByUser(userId: string) {
    for (const record of this.store.values()) {
      if (record.session.userId === userId && record.session.status !== "completed") {
        return {
          session: record.session,
          responses: record.responses,
          diagnostic: record.diagnostic,
        };
      }
    }
    return null;
  }

  async create(input: CreateAssessmentSessionInput): Promise<void> {
    this.store.set(input.session.id, {
      session: {
        id: input.session.id,
        userId: input.session.userId,
        blueprintId: input.session.blueprintId,
        status: input.session.status,
        targetLevel: input.session.targetLevel,
        startedAt: input.session.startedAt,
        completedAt: input.session.completedAt,
        createdAt: input.session.createdAt,
        updatedAt: input.session.updatedAt,
      },
      responses: [...input.session.responses],
    });
  }

  async appendResponse(sessionId: string, response: AssessmentResponse): Promise<void> {
    const record = this.store.get(sessionId);
    if (!record) {
      throw new Error("Session not found");
    }

    record.responses.push(response);
    record.session.updatedAt = response.submittedAt;
  }

  async updateStatus(
    sessionId: string,
    status: AssessmentSession["status"],
    metadata?: { completedAt?: string; targetLevel?: CEFRLevel },
  ): Promise<void> {
    const record = this.store.get(sessionId);
    if (!record) {
      throw new Error("Session not found");
    }

    record.session.status = status;
    if (metadata?.completedAt) {
      record.session.completedAt = metadata.completedAt;
    }
    if (metadata?.targetLevel) {
      record.session.targetLevel = metadata.targetLevel;
    }
  }

  async saveDiagnostic(sessionId: string, diagnostic: AssessmentDiagnostic): Promise<void> {
    const record = this.store.get(sessionId);
    if (!record) {
      throw new Error("Session not found");
    }

    record.diagnostic = diagnostic;
  }
}

class StaticBlueprintProvider implements AssessmentBlueprintProvider {
  constructor(private readonly blueprint: AssessmentBlueprint) {}

  async getById(blueprintId: string): Promise<AssessmentBlueprint | null> {
    return blueprintId === this.blueprint.id ? this.blueprint : null;
  }
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(input: SaveUserInput): Promise<UserEntity> {
    const id = input.id ?? `user-${this.users.size + 1}`;
    const entity: UserEntity = {
      id,
      email: input.email,
      displayName: input.displayName,
      level: input.level,
      role: input.role ?? "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, entity);
    return entity;
  }
}

function createTestBlueprint(): AssessmentBlueprint {
  const rubric = createAssessmentCriterion({
    id: "crit-fluency",
    title: "Fluency",
    skill: "speaking",
    focus: "Maintain flow during interviews",
    weight: 33,
    descriptors: [
      {
        level: "needsSupport",
        minScore: 0,
        maxScore: 25,
        descriptor: "Frequent pauses",
        evidenceExamples: [],
      },
      {
        level: "emerging",
        minScore: 26,
        maxScore: 50,
        descriptor: "Some hesitations",
        evidenceExamples: [],
      },
      {
        level: "proficient",
        minScore: 51,
        maxScore: 75,
        descriptor: "Generally smooth",
        evidenceExamples: [],
      },
      {
        level: "advanced",
        minScore: 76,
        maxScore: 100,
        descriptor: "Natural delivery",
        evidenceExamples: [],
      },
    ],
  });

  const grammar = createMultipleChoiceQuestion({
    id: "grammar-1",
    title: "Verb agreement",
    skill: "grammar",
    cefrLevel: "B1",
    weight: 35,
    stem: "Choose the correct sentence",
    options: [
      { id: "a", label: "Option A", text: "She go to work" },
      { id: "b", label: "Option B", text: "She goes to work" },
    ],
    correctOptionIds: ["b"],
  });

  const listening = createListeningQuestion({
    id: "listening-1",
    title: "Daily standup",
    skill: "listening",
    cefrLevel: "B1",
    weight: 25,
    prompt: "What is the best summary?",
    stimulus: { audioUrl: "https://cdn.local/audio.mp3" },
    options: [
      { id: "a", label: "Option A", text: "Team reviewing blockers" },
      { id: "b", label: "Option B", text: "Planning a vacation" },
    ],
    correctOptionIds: ["a"],
  });

  const speaking = createSpeakingQuestion({
    id: "speaking-1",
    title: "STAR story",
    skill: "speaking",
    cefrLevel: "B2",
    weight: 40,
    rubricCriterionIds: [rubric.id],
    prompt: {
      context: "Describe a production incident",
      instruction: "Share what happened and outcome",
      hints: ["Mention metrics", "Results"],
    },
    expectedDurationSeconds: 90,
  });

  return {
    id: "bp-leveling",
    title: "Leveling v1",
    targetLevel: "B2",
    skillsCovered: ["grammar", "listening", "speaking"],
    questions: [grammar, listening, speaking],
    criteria: [rubric],
  };
}

describe("Assessment use cases", () => {
  let sessions: InMemoryAssessmentSessionRepository;
  let blueprintProvider: AssessmentBlueprintProvider;
  let events: InMemoryRetentionEventEmitter;
  let users: InMemoryUserRepository;
  let transcribe: TranscribeSpeakingAudioUseCase;
  let interviewRubric: UseCase<InterviewRubricEvalInput, InterviewRubricEvalResult>;
  const now = "2025-10-30T10:00:00.000Z";

  beforeEach(() => {
    sessions = new InMemoryAssessmentSessionRepository();
    blueprintProvider = new StaticBlueprintProvider(createTestBlueprint());
    events = new InMemoryRetentionEventEmitter();
    users = new InMemoryUserRepository();

    transcribe = {
      execute: vi.fn(
        async () =>
          ({
            transcription: {
              transcript: "I resolved a production incident by rolling back",
              durationMs: 45000,
            },
          }) satisfies TranscribeShortAudioResult,
      ),
    };

    interviewRubric = {
      execute: vi.fn(
        async () =>
          ({
            overallScore: 82,
            summary: "Strong communication",
            criteria: [
              {
                criterionId: "crit-fluency",
                score: 80,
                evidence: "Clear narration",
              },
            ],
          }) satisfies InterviewRubricEvalResult,
      ),
    };
  });

  describe("StartAssessmentUseCase", () => {
    it("creates a new session when none exists", async () => {
      const useCase = new StartAssessmentUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        idFactory: () => "session-1",
        now: () => now,
      });

      const input: StartAssessmentInput = {
        userId: "user-1",
        blueprintId: "bp-leveling",
        requestedAt: now,
      };

      const result = await useCase.execute(input);

      expect(result.sessionId).toBe("session-1");
      expect(events.events.at(-1)).toEqual(
        expect.objectContaining({
          name: "assessment.started",
          payload: expect.objectContaining({ sessionId: "session-1", userId: "user-1" }),
        }),
      );
    });

    it("returns existing session if user already has an active one", async () => {
      const useCase = new StartAssessmentUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        idFactory: () => "session-1",
        now: () => now,
      });

      await useCase.execute({ userId: "user-1", blueprintId: "bp-leveling", requestedAt: now });
      const result = await useCase.execute({
        userId: "user-1",
        blueprintId: "bp-leveling",
        requestedAt: now,
      });

      expect(result.sessionId).toBe("session-1");
      expect(events.events.filter((event) => event.name === "assessment.started")).toHaveLength(1);
    });
  });

  describe("SubmitAssessmentResponseUseCase", () => {
    let startUseCase: StartAssessmentUseCase;

    beforeEach(async () => {
      startUseCase = new StartAssessmentUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        idFactory: () => "session-1",
        now: () => now,
      });

      await startUseCase.execute({
        userId: "user-1",
        blueprintId: "bp-leveling",
        requestedAt: now,
      });
    });

    it("records a multiple choice response and emits events", async () => {
      const useCase = new SubmitAssessmentResponseUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        transcribe,
        interviewRubric,
      });

      const input: SubmitAssessmentResponseInput = {
        sessionId: "session-1",
        questionId: "grammar-1",
        type: "multipleChoice",
        submittedAt: "2025-10-30T10:01:00.000Z",
        selectedOptionIds: ["b"],
      };

      const result = await useCase.execute(input);

      expect(result).toEqual({
        sessionId: "session-1",
        questionId: "grammar-1",
        totalResponses: 1,
      });
      expect(events.events.at(-1)).toEqual(
        expect.objectContaining({
          name: "assessment.response_recorded",
          payload: expect.objectContaining({ questionId: "grammar-1", answered: 1 }),
        }),
      );
    });

    it("processes a speaking response via ASR and LLM", async () => {
      const useCase = new SubmitAssessmentResponseUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        transcribe,
        interviewRubric,
      });

      const input: SubmitAssessmentResponseInput = {
        sessionId: "session-1",
        questionId: "speaking-1",
        type: "speaking",
        submittedAt: "2025-10-30T10:02:00.000Z",
        audio: { uri: "s3://bucket/audio.m4a" },
      };

      const result = await useCase.execute(input);

      expect(result.totalResponses).toBe(1);
      expect(transcribe.execute).toHaveBeenCalled();
      expect(interviewRubric.execute).toHaveBeenCalled();
    });

    it("emits degradation event when AI providers fail", async () => {
      transcribe.execute = vi.fn(async () => {
        throw new Error("ASR unavailable");
      });

      const useCase = new SubmitAssessmentResponseUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        transcribe,
        interviewRubric,
      });

      const input: SubmitAssessmentResponseInput = {
        sessionId: "session-1",
        questionId: "speaking-1",
        type: "speaking",
        submittedAt: "2025-10-30T10:03:00.000Z",
        audio: { uri: "s3://bucket/audio.m4a" },
      };

      await expect(useCase.execute(input)).rejects.toThrow("ASR unavailable");

      expect(events.events.find((event) => event.name === "assessment.ia_degraded")).toBeTruthy();
    });
  });

  describe("FinalizeAssessmentUseCase", () => {
    beforeEach(async () => {
      const startUseCase = new StartAssessmentUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        idFactory: () => "session-1",
        now: () => now,
      });

      await startUseCase.execute({
        userId: "user-1",
        blueprintId: "bp-leveling",
        requestedAt: now,
      });

      const submitUseCase = new SubmitAssessmentResponseUseCase({
        sessions,
        blueprints: blueprintProvider,
        events,
        transcribe,
        interviewRubric,
      });

      await submitUseCase.execute({
        sessionId: "session-1",
        questionId: "grammar-1",
        type: "multipleChoice",
        submittedAt: "2025-10-30T10:01:00.000Z",
        selectedOptionIds: ["b"],
        confidence: 0.9,
      });

      await submitUseCase.execute({
        sessionId: "session-1",
        questionId: "speaking-1",
        type: "speaking",
        submittedAt: "2025-10-30T10:02:00.000Z",
        audio: { uri: "s3://bucket/audio.m4a" },
      });
    });

    it("finalises the assessment, persists diagnostic and updates user", async () => {
      await users.save({ id: "user-1", email: "test@example.com" });

      const useCase = new FinalizeAssessmentUseCase({
        sessions,
        blueprints: blueprintProvider,
        users,
        events,
      });

      const input: FinalizeAssessmentInput = {
        sessionId: "session-1",
        requestedAt: "2025-10-30T10:05:00.000Z",
      };

      const result = await useCase.execute(input);

      expect(result.recommendedLevel).toBeDefined();
      expect(events.events.at(-1)).toEqual(
        expect.objectContaining({ name: "assessment.completed" }),
      );

      const stored = await sessions.findById("session-1");
      expect(stored?.diagnostic?.overall.level).toBe(result.recommendedLevel);

      const updatedUser = await users.findById("user-1");
      expect(updatedUser?.level).toBe(result.recommendedLevel);
    });
  });
});
