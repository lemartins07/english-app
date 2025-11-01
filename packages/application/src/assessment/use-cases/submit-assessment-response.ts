import {
  type AssessmentResponse,
  type AssessmentSession,
  canRecordResponse,
  type ListeningQuestion,
  type MultipleChoiceQuestion,
  type SpeakingQuestion,
} from "@english-app/domain";
import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type {
  InterviewRubricEvalInput,
  InterviewRubricEvalResult,
  RubricCriterion,
} from "../../llm/types";
import type { TranscribeSpeakingAudioUseCase } from "../../services/transcribe-speaking-audio";
import type { AssessmentBlueprint, AssessmentBlueprintProvider } from "../ports/blueprint-provider";
import type { RetentionEventEmitter } from "../ports/retention-event-emitter";
import type { AssessmentSessionRepository } from "../ports/session-repository";

import { findQuestionOrThrow, loadAssessmentSession } from "./helpers";
import type {
  SubmitAssessmentResponseInput,
  SubmitAssessmentResponseResult,
  SubmitListeningResponseInput,
  SubmitMultipleChoiceResponseInput,
  SubmitSpeakingResponseInput,
} from "./types";

interface SubmitAssessmentResponseDependencies {
  sessions: AssessmentSessionRepository;
  blueprints: AssessmentBlueprintProvider;
  events: RetentionEventEmitter;
  transcribe: TranscribeSpeakingAudioUseCase;
  interviewRubric: UseCase<InterviewRubricEvalInput, InterviewRubricEvalResult>;
  logger?: Logger;
}
function calculateChoiceScore(
  question: MultipleChoiceQuestion | ListeningQuestion,
  selectedOptionIds: string[] | undefined,
): number | undefined {
  if (!question.correctOptionIds?.length || !selectedOptionIds?.length) {
    return undefined;
  }

  const correct = new Set(question.correctOptionIds);
  const selected = new Set(selectedOptionIds);

  if (selected.size === 0) {
    return 0;
  }

  const totalCorrect = correct.size;
  const hits = [...selected].filter((optionId) => correct.has(optionId)).length;
  const misses = [...selected].filter((optionId) => !correct.has(optionId)).length;

  if (misses > 0) {
    return Math.max(0, Math.round((hits / (hits + misses)) * 100));
  }

  return Math.round((hits / totalCorrect) * 100);
}

function buildMultipleChoiceResponse(
  session: AssessmentSession,
  question: MultipleChoiceQuestion,
  input: SubmitMultipleChoiceResponseInput,
): AssessmentResponse {
  const uniqueOptionIds = [
    ...new Set(
      input.selectedOptionIds.map((id) => id.trim()).filter((optionId) => optionId.length > 0),
    ),
  ];

  if (uniqueOptionIds.length === 0) {
    throw new Error("At least one option must be selected for a multiple choice response.");
  }
  const score = calculateChoiceScore(question, uniqueOptionIds);

  return {
    questionId: question.id,
    type: "multipleChoice",
    submittedAt: input.submittedAt,
    selectedOptionIds: uniqueOptionIds,
    confidence: input.confidence,
    score,
  };
}

function buildListeningResponse(
  session: AssessmentSession,
  question: ListeningQuestion,
  input: SubmitListeningResponseInput,
): AssessmentResponse {
  const uniqueOptionIds = input.selectedOptionIds
    ? [...new Set(input.selectedOptionIds.map((id) => id.trim()))]
    : undefined;
  const score = calculateChoiceScore(question, uniqueOptionIds);

  return {
    questionId: question.id,
    type: "listening",
    submittedAt: input.submittedAt,
    selectedOptionIds: uniqueOptionIds,
    notes: input.notes?.trim(),
    confidence: input.confidence,
    score,
  };
}

function toRubricCriterion(criterion: AssessmentBlueprint["criteria"][number]): RubricCriterion {
  const expectations = criterion.descriptors
    .map(
      (descriptor) =>
        `${descriptor.level.toUpperCase()}: ${descriptor.descriptor} (${descriptor.minScore}-${descriptor.maxScore})`,
    )
    .join("\n");

  return {
    id: criterion.id,
    title: criterion.title,
    description: `${criterion.focus} (${criterion.skill})`,
    weight: criterion.weight,
    expectations,
  };
}

async function buildSpeakingResponse(
  session: AssessmentSession,
  blueprint: AssessmentBlueprint,
  question: SpeakingQuestion,
  input: SubmitSpeakingResponseInput,
  dependencies: Pick<
    SubmitAssessmentResponseDependencies,
    "transcribe" | "interviewRubric" | "logger" | "events"
  >,
): Promise<AssessmentResponse> {
  try {
    const transcription = await dependencies.transcribe.execute({
      fileRef: input.audio,
      localeHint: input.localeHint,
      prompt: input.prompt,
    });

    const rubricCriteria = question.rubricCriterionIds.map((criterionId) => {
      const criterion = blueprint.criteria.find((item) => item.id === criterionId);
      if (!criterion) {
        throw new Error(
          `Rubric criterion "${criterionId}" not found for question "${question.id}".`,
        );
      }
      return toRubricCriterion(criterion);
    });

    const evaluation = await dependencies.interviewRubric.execute({
      transcript: transcription.transcription.transcript,
      rubric: rubricCriteria,
      context: {},
    });

    const rubricScores = Object.fromEntries(
      evaluation.criteria.map((criterion) => [criterion.criterionId, Math.round(criterion.score)]),
    );

    return {
      questionId: question.id,
      type: "speaking",
      submittedAt: input.submittedAt,
      transcript: transcription.transcription.transcript,
      audioUrl: input.audio.uri,
      rubricScores,
      score: Math.round(evaluation.overallScore),
    };
  } catch (error) {
    dependencies.logger?.error?.("Failed to process speaking response with AI providers", {
      sessionId: session.id,
      questionId: question.id,
      error: error instanceof Error ? error.message : "unknown",
    });

    dependencies.events.emit("assessment.ia_degraded", {
      sessionId: session.id,
      questionId: question.id,
      type: "speaking",
    });

    throw error;
  }
}

export class SubmitAssessmentResponseUseCase
  implements UseCase<SubmitAssessmentResponseInput, SubmitAssessmentResponseResult>
{
  private readonly sessions: AssessmentSessionRepository;
  private readonly blueprints: AssessmentBlueprintProvider;
  private readonly events: RetentionEventEmitter;
  private readonly transcribe: TranscribeSpeakingAudioUseCase;
  private readonly interviewRubric: UseCase<InterviewRubricEvalInput, InterviewRubricEvalResult>;
  private readonly logger?: Logger;

  constructor(dependencies: SubmitAssessmentResponseDependencies) {
    this.sessions = dependencies.sessions;
    this.blueprints = dependencies.blueprints;
    this.events = dependencies.events;
    this.transcribe = dependencies.transcribe;
    this.interviewRubric = dependencies.interviewRubric;
    this.logger = dependencies.logger;
  }

  async execute(input: SubmitAssessmentResponseInput): Promise<SubmitAssessmentResponseResult> {
    const { session, blueprint } = await loadAssessmentSession(input.sessionId, {
      sessions: this.sessions,
      blueprints: this.blueprints,
    });

    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error("Cannot record responses for finalised assessment sessions.");
    }

    const question = findQuestionOrThrow(blueprint.questions, input.questionId);
    if (!canRecordResponse(session, question.id, question.skill)) {
      throw new Error(`Assessment response for question "${question.id}" is not allowed.`);
    }

    let response: AssessmentResponse;
    switch (input.type) {
      case "multipleChoice": {
        if (question.type !== "multipleChoice") {
          throw new Error(`Question "${question.id}" is not of type multipleChoice.`);
        }
        response = buildMultipleChoiceResponse(session, question, input);
        break;
      }
      case "listening": {
        if (question.type !== "listening") {
          throw new Error(`Question "${question.id}" is not of type listening.`);
        }
        response = buildListeningResponse(session, question, input);
        break;
      }
      case "speaking": {
        if (question.type !== "speaking") {
          throw new Error(`Question "${question.id}" is not of type speaking.`);
        }
        response = await buildSpeakingResponse(session, blueprint, question, input, {
          transcribe: this.transcribe,
          interviewRubric: this.interviewRubric,
          logger: this.logger,
          events: this.events,
        });
        break;
      }
      default:
        throw new Error(`Unsupported response type "${(input as { type?: string }).type}".`);
    }

    await this.sessions.appendResponse(session.id, response);

    this.events.emit("assessment.response_recorded", {
      sessionId: session.id,
      questionId: question.id,
      type: response.type,
      answered: session.responses.length + 1,
      total: session.questions.length,
    });

    return {
      sessionId: session.id,
      questionId: question.id,
      totalResponses: session.responses.length + 1,
    };
  }
}
