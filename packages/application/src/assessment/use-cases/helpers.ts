import {
  type AssessmentDiagnostic,
  type AssessmentQuestion,
  type AssessmentResponse,
  type AssessmentSession,
  type AssessmentSkill,
  createAssessmentSession,
} from "@english-app/domain";

import type { AssessmentBlueprint, AssessmentBlueprintProvider } from "../ports/blueprint-provider";
import type {
  AssessmentSessionRepository,
  StoredAssessmentSession,
} from "../ports/session-repository";

export interface LoadedAssessmentSession {
  stored: StoredAssessmentSession;
  session: AssessmentSession;
  blueprint: AssessmentBlueprint;
}

interface LoadSessionDependencies {
  sessions: AssessmentSessionRepository;
  blueprints: AssessmentBlueprintProvider;
}

export async function loadAssessmentSession(
  sessionId: string,
  dependencies: LoadSessionDependencies,
): Promise<LoadedAssessmentSession> {
  const stored = await dependencies.sessions.findById(sessionId);
  if (!stored) {
    throw new Error(`Assessment session "${sessionId}" not found.`);
  }

  const blueprint = await dependencies.blueprints.getById(stored.session.blueprintId);
  if (!blueprint) {
    throw new Error(`Assessment blueprint "${stored.session.blueprintId}" not found.`);
  }

  const session = createAssessmentSession({
    id: stored.session.id,
    userId: stored.session.userId,
    blueprintId: stored.session.blueprintId,
    status: normalizeStatus(stored.session.status),
    targetLevel: stored.session.targetLevel ?? blueprint.targetLevel,
    questions: blueprint.questions,
    responses: stored.responses,
    diagnostic: stored.diagnostic,
    startedAt: stored.session.startedAt,
    completedAt: stored.session.completedAt,
    createdAt: stored.session.createdAt,
    updatedAt: stored.session.updatedAt,
  });

  return { stored, session, blueprint };
}

function normalizeStatus(status: AssessmentSession["status"]): AssessmentSession["status"] {
  // Stored sessions may persist uppercase enum variants from the database. Normalise to domain values.
  const normalized = String(status).toLowerCase();
  switch (normalized) {
    case "pending":
      return "draft";
    case "in_progress":
    case "inprogress":
      return "inProgress";
    case "completed":
      return "completed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return status;
  }
}

export function findQuestionOrThrow(
  questions: AssessmentQuestion[],
  questionId: string,
): AssessmentQuestion {
  const question = questions.find((item) => item.id === questionId);
  if (!question) {
    throw new Error(`Question "${questionId}" not found in assessment blueprint.`);
  }
  return question;
}

export function mergeDiagnostic(
  base: AssessmentDiagnostic | undefined,
  extra: Partial<AssessmentDiagnostic>,
): AssessmentDiagnostic | undefined {
  if (!base) {
    return extra as AssessmentDiagnostic;
  }

  return {
    ...base,
    overall: extra.overall ?? base.overall,
    skills: extra.skills ?? base.skills,
    recommendations: extra.recommendations ?? base.recommendations,
    notes: extra.notes ?? base.notes,
  };
}

export interface ScoreBreakdown {
  overallScore: number;
  skillScores: Record<AssessmentSkill, { score: number; weight: number }>;
  totalWeight: number;
  answeredWeight: number;
  evaluatedResponses: number;
}

export function computeScoreBreakdown(
  questions: AssessmentQuestion[],
  responses: AssessmentResponse[],
): ScoreBreakdown {
  const totalWeight = questions.reduce((acc, question) => acc + (question.weight ?? 0), 0) || 1;
  const skillScores = new Map<AssessmentSkill, { scoreSum: number; weightSum: number }>();

  let weightedScoreSum = 0;
  let answeredWeight = 0;
  let evaluatedResponses = 0;

  questions.forEach((question) => {
    const weight = question.weight ?? 0;
    if (!skillScores.has(question.skill)) {
      skillScores.set(question.skill, { scoreSum: 0, weightSum: 0 });
    }

    const response = responses.find((item) => item.questionId === question.id);
    if (!response) {
      const skillEntry = skillScores.get(question.skill)!;
      skillEntry.weightSum += weight;
      return;
    }

    const score = response.score ?? 0;
    const normalizedScore = Math.max(0, Math.min(100, score));

    weightedScoreSum += normalizedScore * weight;
    answeredWeight += weight;
    evaluatedResponses += 1;

    const skillEntry = skillScores.get(question.skill)!;
    skillEntry.scoreSum += normalizedScore * weight;
    skillEntry.weightSum += weight;
  });

  const breakdown: ScoreBreakdown = {
    overallScore: Math.round(weightedScoreSum / (totalWeight || 1)),
    skillScores: Object.fromEntries(
      [...skillScores.entries()].map(([skill, entry]) => {
        const weightSum = entry.weightSum || 1;
        const score = Math.round(entry.scoreSum / weightSum);
        return [skill, { score, weight: entry.weightSum }];
      }),
    ) as Record<AssessmentSkill, { score: number; weight: number }>,
    totalWeight,
    answeredWeight,
    evaluatedResponses,
  };

  return breakdown;
}

export function inferConfidenceFromCoverage(breakdown: ScoreBreakdown): "low" | "medium" | "high" {
  const coverage = breakdown.answeredWeight / (breakdown.totalWeight || 1);
  if (coverage >= 0.85) {
    return "high";
  }
  if (coverage >= 0.6) {
    return "medium";
  }
  return "low";
}
