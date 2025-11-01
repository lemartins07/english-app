import {
  type AssessmentSession,
  createAssessmentSession,
  type ISODateString,
} from "@english-app/domain";

import type { UseCase } from "../../index";
import type { AssessmentBlueprintProvider } from "../ports/blueprint-provider";
import type { RetentionEventEmitter } from "../ports/retention-event-emitter";
import type { AssessmentSessionRepository } from "../ports/session-repository";

import type { StartAssessmentInput, StartAssessmentResult } from "./types";

interface StartAssessmentDependencies {
  sessions: AssessmentSessionRepository;
  blueprints: AssessmentBlueprintProvider;
  events: RetentionEventEmitter;
  now?: () => ISODateString;
  idFactory?: () => string;
}

function defaultNow(): ISODateString {
  return new Date().toISOString() as ISODateString;
}

function defaultIdFactory(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export class StartAssessmentUseCase
  implements UseCase<StartAssessmentInput, StartAssessmentResult>
{
  private readonly sessions: AssessmentSessionRepository;
  private readonly blueprints: AssessmentBlueprintProvider;
  private readonly events: RetentionEventEmitter;
  private readonly now: () => ISODateString;
  private readonly idFactory: () => string;

  constructor(dependencies: StartAssessmentDependencies) {
    this.sessions = dependencies.sessions;
    this.blueprints = dependencies.blueprints;
    this.events = dependencies.events;
    this.now = dependencies.now ?? defaultNow;
    this.idFactory = dependencies.idFactory ?? defaultIdFactory;
  }

  async execute(input: StartAssessmentInput): Promise<StartAssessmentResult> {
    const existingSession = await this.sessions.findActiveByUser(input.userId);
    if (existingSession) {
      return { sessionId: existingSession.session.id };
    }

    const blueprint = await this.blueprints.getById(input.blueprintId);
    if (!blueprint) {
      throw new Error(`Assessment blueprint "${input.blueprintId}" not found.`);
    }

    const timestamp = input.requestedAt ?? this.now();
    const sessionId = this.idFactory();

    const session: AssessmentSession = createAssessmentSession({
      id: sessionId,
      userId: input.userId,
      blueprintId: blueprint.id,
      targetLevel: input.targetLevel ?? blueprint.targetLevel,
      questions: blueprint.questions,
      responses: [],
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "inProgress",
    });

    await this.sessions.create({ session });
    this.events.emit("assessment.started", {
      sessionId,
      userId: input.userId,
      blueprintId: blueprint.id,
      skills: blueprint.skillsCovered,
    });

    return { sessionId };
  }
}
