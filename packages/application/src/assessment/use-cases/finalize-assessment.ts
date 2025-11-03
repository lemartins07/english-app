import { type AssessmentSkill, createAssessmentDiagnostic } from "@english-app/domain";
import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { UserRepository } from "../../repositories/user-repository";
import type { AssessmentBlueprintProvider } from "../ports/blueprint-provider";
import type { RetentionEventEmitter } from "../ports/retention-event-emitter";
import type { AssessmentSessionRepository } from "../ports/session-repository";

import {
  computeScoreBreakdown,
  inferConfidenceFromCoverage,
  loadAssessmentSession,
} from "./helpers";
import type { FinalizeAssessmentInput, FinalizeAssessmentResult } from "./types";

interface FinalizeAssessmentDependencies {
  sessions: AssessmentSessionRepository;
  blueprints: AssessmentBlueprintProvider;
  users: UserRepository;
  events: RetentionEventEmitter;
  logger?: Logger;
}

function inferStrengths(score: number, skill: AssessmentSkill): string[] {
  if (score >= 75) {
    return [`Excelente domínio de ${skill}, pronto para entrevistas de alto impacto.`];
  }
  if (score >= 60) {
    return [`Bom desempenho em ${skill}, mantenha a prática para consolidar.`];
  }
  return [];
}

function inferImprovements(score: number, skill: AssessmentSkill): string[] {
  if (score >= 60) {
    return [];
  }
  if (score >= 45) {
    return [`Reforce ${skill} com revisão focada e exercícios semanais.`];
  }
  return [`Priorize ${skill} com sessões guiadas e feedback estruturado.`];
}

export class FinalizeAssessmentUseCase
  implements UseCase<FinalizeAssessmentInput, FinalizeAssessmentResult>
{
  private readonly sessions: AssessmentSessionRepository;
  private readonly blueprints: AssessmentBlueprintProvider;
  private readonly users: UserRepository;
  private readonly events: RetentionEventEmitter;
  private readonly logger?: Logger;

  constructor(dependencies: FinalizeAssessmentDependencies) {
    this.sessions = dependencies.sessions;
    this.blueprints = dependencies.blueprints;
    this.users = dependencies.users;
    this.events = dependencies.events;
    this.logger = dependencies.logger;
  }

  async execute(input: FinalizeAssessmentInput): Promise<FinalizeAssessmentResult> {
    const { session, blueprint, stored } = await loadAssessmentSession(input.sessionId, {
      sessions: this.sessions,
      blueprints: this.blueprints,
    });

    if (session.status === "completed") {
      return {
        sessionId: session.id,
        recommendedLevel: stored.diagnostic?.overall.level ?? session.targetLevel ?? "",
      };
    }

    const breakdown = computeScoreBreakdown(blueprint.questions, session.responses);
    const confidence = inferConfidenceFromCoverage(breakdown);

    const skillDiagnostics = Object.entries(breakdown.skillScores).map(([skill, entry]) => ({
      skill: skill as AssessmentSkill,
      score: entry.score,
      percentile: undefined,
      strengths: inferStrengths(entry.score, skill as AssessmentSkill),
      improvements: inferImprovements(entry.score, skill as AssessmentSkill),
    }));

    const recommendations = skillDiagnostics
      .filter((item) => item.improvements.length > 0)
      .map((item) => item.improvements[0]);

    const diagnostic = createAssessmentDiagnostic({
      score: breakdown.overallScore,
      confidence,
      skills: skillDiagnostics,
      recommendations,
      rationale: [],
    });

    await this.sessions.saveDiagnostic(session.id, diagnostic);
    await this.sessions.updateStatus(session.id, "completed", {
      completedAt: input.requestedAt,
      targetLevel: diagnostic.overall.level,
    });

    const user = await this.users.findById(session.userId);
    if (user) {
      await this.users.save({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        level: diagnostic.overall.level,
        role: user.role,
        hasCompletedPlacementTest: true,
      });
    } else {
      this.logger?.warn?.("Unable to update user level after assessment", {
        userId: session.userId,
      });
    }

    this.events.emit("assessment.completed", {
      sessionId: session.id,
      userId: session.userId,
      level: diagnostic.overall.level,
    });

    return {
      sessionId: session.id,
      recommendedLevel: diagnostic.overall.level,
    };
  }
}
