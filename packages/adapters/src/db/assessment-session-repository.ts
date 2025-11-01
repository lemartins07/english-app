import type {
  AssessmentSessionRepository,
  CreateAssessmentSessionInput,
  StoredAssessmentSession,
} from "@english-app/application";
import type {
  AssessmentDiagnostic,
  AssessmentResponse,
  AssessmentSession,
} from "@english-app/domain";
import { isValidCEFRLevel } from "@english-app/domain";

import { getPrismaClient } from "./prisma-client";

type PrismaClient = ReturnType<typeof getPrismaClient>;

type PrismaJsonValue =
  | string
  | number
  | boolean
  | null
  | PrismaJsonValue[]
  | { [key: string]: PrismaJsonValue };

interface AssessmentAnswerRecord {
  questionId: string;
  questionType: string;
  content: PrismaJsonValue;
  evaluation?: PrismaJsonValue | null;
  score?: unknown;
  createdAt: Date;
}

interface AssessmentResultRecord {
  level: string;
  overallScore?: unknown;
  skillScores?: PrismaJsonValue | null;
  strengths?: PrismaJsonValue | null;
  areasToImprove?: PrismaJsonValue | null;
  recommendations?: PrismaJsonValue | null;
  summary?: string | null;
}

interface AssessmentSessionRecord {
  id: string;
  userId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: PrismaJsonValue | null;
  answers: AssessmentAnswerRecord[];
  result: AssessmentResultRecord | null;
}

interface AssessmentSessionDelegate {
  findUnique(params: unknown): Promise<AssessmentSessionRecord | null>;
  findFirst(params: unknown): Promise<AssessmentSessionRecord | null>;
  create(params: unknown): Promise<void>;
  update(params: unknown): Promise<void>;
}

interface AssessmentAnswerDelegate {
  upsert(params: unknown): Promise<void>;
}

interface AssessmentResultDelegate {
  upsert(params: unknown): Promise<void>;
}

interface PrismaAssessmentClient {
  assessmentSession: AssessmentSessionDelegate;
  assessmentAnswer: AssessmentAnswerDelegate;
  assessmentResult: AssessmentResultDelegate;
}

const DOMAIN_TO_DB_STATUS: Record<
  AssessmentSession["status"],
  "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
> = {
  draft: "PENDING",
  inProgress: "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

const DB_TO_DOMAIN_STATUS: Record<string, AssessmentSession["status"]> = {
  PENDING: "draft",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

function toDomainStatus(status: string): AssessmentSession["status"] {
  return DB_TO_DOMAIN_STATUS[status] ?? (status as AssessmentSession["status"]);
}

function asRecord(value: PrismaJsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((item): item is string => typeof item === "string");
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function toDomainResponse(answer: AssessmentAnswerRecord): AssessmentResponse {
  const content = asRecord(answer.content);
  const evaluation = asRecord(answer.evaluation ?? null);
  const submittedAt =
    typeof content.submittedAt === "string" ? content.submittedAt : answer.createdAt.toISOString();
  const score = asNumber(answer.score);

  switch (answer.questionType) {
    case "MCQ":
      return {
        questionId: answer.questionId,
        type: "multipleChoice",
        submittedAt,
        selectedOptionIds: asStringArray(content.selectedOptionIds) ?? [],
        confidence: asNumber(content.confidence),
        score,
      };
    case "LISTENING":
      return {
        questionId: answer.questionId,
        type: "listening",
        submittedAt,
        selectedOptionIds: asStringArray(content.selectedOptionIds),
        notes: typeof content.notes === "string" ? content.notes : undefined,
        confidence: asNumber(content.confidence),
        score,
      };
    case "SPEAKING":
      return {
        questionId: answer.questionId,
        type: "speaking",
        submittedAt,
        transcript: typeof content.transcript === "string" ? content.transcript : "",
        audioUrl: typeof content.audioUrl === "string" ? content.audioUrl : undefined,
        rubricScores:
          evaluation.rubricScores && typeof evaluation.rubricScores === "object"
            ? (evaluation.rubricScores as Record<string, number>)
            : undefined,
        score,
      };
    default:
      throw new Error(`Unsupported assessment answer type "${answer.questionType}".`);
  }
}

function toPersistencePayload(response: AssessmentResponse) {
  switch (response.type) {
    case "multipleChoice":
      return {
        questionType: "MCQ" as const,
        content: {
          selectedOptionIds: response.selectedOptionIds,
          confidence: response.confidence,
          submittedAt: response.submittedAt,
        },
        evaluation: null,
      };
    case "listening":
      return {
        questionType: "LISTENING" as const,
        content: {
          selectedOptionIds: response.selectedOptionIds,
          notes: response.notes,
          confidence: response.confidence,
          submittedAt: response.submittedAt,
        },
        evaluation: null,
      };
    case "speaking":
      return {
        questionType: "SPEAKING" as const,
        content: {
          transcript: response.transcript,
          audioUrl: response.audioUrl,
          submittedAt: response.submittedAt,
        },
        evaluation: {
          rubricScores: response.rubricScores,
        },
      };
    default:
      throw new Error("Unsupported response type.");
  }
}

function toStoredAssessmentSession(record: AssessmentSessionRecord): StoredAssessmentSession {
  const metadata = asRecord(record.metadata);
  const blueprintId = metadata.blueprintId;
  if (typeof blueprintId !== "string") {
    throw new Error("Assessment session missing blueprintId metadata.");
  }

  return {
    session: {
      id: record.id,
      userId: record.userId,
      blueprintId,
      status: toDomainStatus(record.status),
      targetLevel:
        typeof metadata.targetLevel === "string" && isValidCEFRLevel(metadata.targetLevel)
          ? metadata.targetLevel
          : undefined,
      startedAt: record.startedAt.toISOString(),
      completedAt: record.completedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    responses: record.answers.map(toDomainResponse),
    diagnostic: record.result ? toDiagnostic(record.result) : undefined,
  };
}

function toDiagnostic(result: AssessmentResultRecord): AssessmentDiagnostic {
  const payload = result.skillScores as AssessmentDiagnostic | null | undefined;
  if (payload?.overall) {
    return payload;
  }

  const levelValue = result.level;
  if (typeof levelValue !== "string" || !isValidCEFRLevel(levelValue)) {
    throw new Error("Assessment result stored with invalid CEFR level.");
  }

  return {
    overall: {
      level: levelValue,
      score: asNumber(result.overallScore) ?? 0,
      confidence: "medium",
      band: {
        level: levelValue,
        minScore: 0,
        maxScore: 100,
        label: levelValue,
        description: result.summary ?? "",
      },
      rationale: [],
    },
    skills: [],
    recommendations: asStringArray(result.recommendations) ?? [],
    notes: result.summary ?? undefined,
  };
}

export class PrismaAssessmentSessionRepository implements AssessmentSessionRepository {
  private readonly prisma: PrismaAssessmentClient;

  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma as unknown as PrismaAssessmentClient;
  }

  async findById(sessionId: string): Promise<StoredAssessmentSession | null> {
    const record = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: { orderBy: { createdAt: "asc" } },
        result: true,
      },
    });

    if (!record) {
      return null;
    }

    return toStoredAssessmentSession(record);
  }

  async findActiveByUser(userId: string): Promise<StoredAssessmentSession | null> {
    const record = await this.prisma.assessmentSession.findFirst({
      where: {
        userId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        answers: { orderBy: { createdAt: "asc" } },
        result: true,
      },
    });

    if (!record) {
      return null;
    }

    return toStoredAssessmentSession(record);
  }

  async create(input: CreateAssessmentSessionInput): Promise<void> {
    const session = input.session;
    await this.prisma.assessmentSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        type: "LEVELING",
        status: DOMAIN_TO_DB_STATUS[session.status],
        startedAt: new Date(session.startedAt),
        completedAt: session.completedAt ? new Date(session.completedAt) : null,
        metadata: {
          blueprintId: session.blueprintId,
          targetLevel: session.targetLevel,
        },
      },
    });
  }

  async appendResponse(sessionId: string, response: AssessmentResponse): Promise<void> {
    const payload = toPersistencePayload(response);

    await this.prisma.assessmentAnswer.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId: response.questionId,
        },
      },
      create: {
        sessionId,
        questionId: response.questionId,
        questionType: payload.questionType,
        content: payload.content,
        evaluation: payload.evaluation,
        score: response.score !== undefined ? response.score.toFixed(2) : null,
        maxScore: "100.00",
      },
      update: {
        content: payload.content,
        evaluation: payload.evaluation,
        score: response.score !== undefined ? response.score.toFixed(2) : null,
      },
    });
  }

  async updateStatus(
    sessionId: string,
    status: AssessmentSession["status"],
    metadata?: {
      completedAt?: AssessmentSession["completedAt"];
      targetLevel?: AssessmentSession["targetLevel"];
    },
  ): Promise<void> {
    const existing = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { metadata: true },
    });

    const currentMetadata = asRecord(existing?.metadata ?? null);
    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: DOMAIN_TO_DB_STATUS[status],
        completedAt: metadata?.completedAt ? new Date(metadata.completedAt) : undefined,
        metadata: {
          ...currentMetadata,
          ...(metadata?.targetLevel ? { targetLevel: metadata.targetLevel } : {}),
        },
      },
    });
  }

  async saveDiagnostic(sessionId: string, diagnostic: AssessmentDiagnostic): Promise<void> {
    await this.prisma.assessmentResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        level: diagnostic.overall.level,
        overallScore: diagnostic.overall.score.toFixed(2),
        skillScores: diagnostic,
        strengths: diagnostic.skills.flatMap((item) => item.strengths ?? []),
        areasToImprove: diagnostic.skills.flatMap((item) => item.improvements ?? []),
        recommendations: diagnostic.recommendations,
        summary: diagnostic.notes,
      },
      update: {
        level: diagnostic.overall.level,
        overallScore: diagnostic.overall.score.toFixed(2),
        skillScores: diagnostic,
        strengths: diagnostic.skills.flatMap((item) => item.strengths ?? []),
        areasToImprove: diagnostic.skills.flatMap((item) => item.improvements ?? []),
        recommendations: diagnostic.recommendations,
        summary: diagnostic.notes,
      },
    });
  }
}
