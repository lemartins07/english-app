import type { ISODateString } from "../../core";
import type { CEFRLevel } from "../../shared/cefr";
import {
  ASSESSMENT_QUESTION_TYPES,
  type AssessmentQuestion,
  type AssessmentSkill,
  ensureAssessmentQuestionSet,
  type ListeningQuestion,
  type MultipleChoiceQuestion,
} from "../value-objects/questions";

import type { AssessmentDiagnostic } from "./diagnostic";

export const ASSESSMENT_SESSION_STATUSES = [
  "draft",
  "inProgress",
  "completed",
  "cancelled",
] as const;

type AssessmentSessionStatus = (typeof ASSESSMENT_SESSION_STATUSES)[number];

export interface AssessmentResponseBase {
  questionId: string;
  submittedAt: ISODateString;
  score?: number;
}

export interface MultipleChoiceResponse extends AssessmentResponseBase {
  type: "multipleChoice";
  selectedOptionIds: string[];
  confidence?: number;
}

export interface ListeningResponse extends AssessmentResponseBase {
  type: "listening";
  selectedOptionIds?: string[];
  notes?: string;
  confidence?: number;
}

export interface SpeakingResponse extends AssessmentResponseBase {
  type: "speaking";
  transcript: string;
  audioUrl?: string;
  rubricScores?: Record<string, number>;
}

export type AssessmentResponse = MultipleChoiceResponse | ListeningResponse | SpeakingResponse;

export interface AssessmentSession {
  id: string;
  userId: string;
  blueprintId: string;
  status: AssessmentSessionStatus;
  targetLevel?: CEFRLevel;
  questions: AssessmentQuestion[];
  responses: AssessmentResponse[];
  diagnostic?: AssessmentDiagnostic;
  startedAt: ISODateString;
  completedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AssessmentSessionInput {
  id: string;
  userId: string;
  blueprintId: string;
  targetLevel?: CEFRLevel;
  questions: AssessmentQuestion[];
  responses?: AssessmentResponse[];
  diagnostic?: AssessmentDiagnostic;
  startedAt: ISODateString;
  completedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  status?: AssessmentSessionStatus;
}

function sanitizeScore(score: number | undefined): number | undefined {
  if (score === undefined) {
    return undefined;
  }

  if (Number.isNaN(score)) {
    throw new Error("Assessment response scores must be numeric.");
  }

  if (score < 0 || score > 100) {
    throw new Error("Assessment response scores must be within the 0-100 range.");
  }

  return Math.round(score * 100) / 100;
}

function sanitizeConfidence(confidence: number | undefined): number | undefined {
  if (confidence === undefined) {
    return undefined;
  }

  if (Number.isNaN(confidence)) {
    throw new Error("Confidence values must be numeric when provided.");
  }

  if (confidence < 0 || confidence > 1) {
    throw new Error("Confidence values must be between 0 and 1.");
  }

  return Math.round(confidence * 100) / 100;
}

function normalizeTranscript(transcript: string): string {
  if (!transcript?.trim()) {
    throw new Error("Speaking responses must include a transcript for evaluation.");
  }

  return transcript.trim();
}

function sanitizeRubricScores(scores?: Record<string, number>): Record<string, number> | undefined {
  if (!scores) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(scores).map(([criterionId, value]) => {
    if (!criterionId.trim()) {
      throw new Error("Rubric score keys must be non-empty criterion ids.");
    }

    if (Number.isNaN(value)) {
      throw new Error("Rubric scores must be numeric.");
    }

    if (value < 0 || value > 100) {
      throw new Error("Rubric scores must be within the 0-100 range.");
    }

    return [criterionId.trim(), Math.round(value * 100) / 100] as const;
  });

  return Object.fromEntries(sanitizedEntries);
}

function buildQuestionMap(questions: AssessmentQuestion[]) {
  return new Map<string, AssessmentQuestion>(questions.map((question) => [question.id, question]));
}

function assertQuestionExists(
  questionMap: Map<string, AssessmentQuestion>,
  questionId: string,
): AssessmentQuestion {
  const question = questionMap.get(questionId);

  if (!question) {
    throw new Error(`Assessment response references unknown question "${questionId}".`);
  }

  return question;
}

function ensureUniqueResponses(responses: AssessmentResponse[]): void {
  const seenQuestionIds = new Set<string>();
  responses.forEach((response) => {
    if (seenQuestionIds.has(response.questionId)) {
      throw new Error(
        `Assessment responses must target unique questions. Duplicate response for "${response.questionId}".`,
      );
    }
    seenQuestionIds.add(response.questionId);
  });
}

function sanitizeMultipleChoiceResponse(
  response: MultipleChoiceResponse,
  question: MultipleChoiceQuestion,
): MultipleChoiceResponse {
  if (!response.selectedOptionIds?.length) {
    throw new Error(`Question "${question.id}" responses must select at least one option.`);
  }

  const optionIds = new Set(question.options.map((option) => option.id));
  const selected = Array.from(new Set(response.selectedOptionIds.map((id) => id.trim()))).filter(
    (id) => {
      if (!optionIds.has(id)) {
        throw new Error(`Response for question "${question.id}" selected unknown option "${id}".`);
      }
      return true;
    },
  );

  return {
    ...response,
    selectedOptionIds: selected,
    score: sanitizeScore(response.score),
    confidence: sanitizeConfidence(response.confidence),
  };
}

function sanitizeListeningResponse(
  response: ListeningResponse,
  question: ListeningQuestion,
): ListeningResponse {
  const options = question.options;
  const selectedOptionIds = response.selectedOptionIds?.length
    ? Array.from(new Set(response.selectedOptionIds.map((id) => id.trim())))
    : undefined;

  if (selectedOptionIds && options) {
    const optionIds = new Set(options.map((option) => option.id));
    selectedOptionIds.forEach((id) => {
      if (!optionIds.has(id)) {
        throw new Error(`Response for question "${question.id}" selected unknown option "${id}".`);
      }
    });
  }

  return {
    ...response,
    selectedOptionIds,
    notes: response.notes?.trim(),
    score: sanitizeScore(response.score),
    confidence: sanitizeConfidence(response.confidence),
  };
}

function sanitizeSpeakingResponse(response: SpeakingResponse): SpeakingResponse {
  return {
    ...response,
    transcript: normalizeTranscript(response.transcript),
    audioUrl: response.audioUrl?.trim(),
    score: sanitizeScore(response.score),
    rubricScores: sanitizeRubricScores(response.rubricScores),
  };
}

function sanitizeResponses(
  responses: AssessmentResponse[],
  questions: AssessmentQuestion[],
): AssessmentResponse[] {
  if (!responses.length) {
    return [];
  }

  ensureUniqueResponses(responses);
  const questionMap = buildQuestionMap(questions);

  return responses.map((response) => {
    const question = assertQuestionExists(questionMap, response.questionId);
    const responseType = response.type;

    switch (responseType) {
      case "multipleChoice": {
        if (question.type !== "multipleChoice") {
          throw new Error(
            `Response type mismatch for question "${question.id}". Expected "multipleChoice".`,
          );
        }
        return sanitizeMultipleChoiceResponse(response, question);
      }
      case "listening": {
        if (question.type !== "listening") {
          throw new Error(
            `Response type mismatch for question "${question.id}". Expected "listening".`,
          );
        }
        return sanitizeListeningResponse(response, question);
      }
      case "speaking": {
        if (question.type !== "speaking") {
          throw new Error(
            `Response type mismatch for question "${question.id}". Expected "speaking".`,
          );
        }
        return sanitizeSpeakingResponse(response);
      }
      default:
        throw new Error(
          `Unsupported response type "${responseType}". Expected one of ${ASSESSMENT_QUESTION_TYPES.join(", ")}.`,
        );
    }
  });
}

function ensureStatus(status: AssessmentSessionStatus): AssessmentSessionStatus {
  if (!ASSESSMENT_SESSION_STATUSES.includes(status)) {
    throw new Error(`Assessment session status "${status}" is not supported.`);
  }

  return status;
}

export function createAssessmentSession(input: AssessmentSessionInput): AssessmentSession {
  ensureAssessmentQuestionSet(input.questions);

  const responses = sanitizeResponses(input.responses ?? [], input.questions);

  if (!input.startedAt?.trim()) {
    throw new Error("Assessment sessions must record a start timestamp.");
  }

  if (!input.createdAt?.trim() || !input.updatedAt?.trim()) {
    throw new Error("Assessment sessions must include audit timestamps.");
  }

  if (input.completedAt && input.completedAt < input.startedAt) {
    throw new Error("Assessment completedAt timestamp must be after startedAt.");
  }

  return {
    id: input.id,
    userId: input.userId,
    blueprintId: input.blueprintId,
    targetLevel: input.targetLevel,
    questions: input.questions,
    responses,
    diagnostic: input.diagnostic,
    status: ensureStatus(input.status ?? "inProgress"),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function calculateSessionProgress(session: AssessmentSession): number {
  if (!session.questions.length) {
    return 0;
  }

  const answered = new Set(session.responses.map((response) => response.questionId)).size;
  const progress = answered / session.questions.length;

  return Math.round(progress * 100) / 100;
}

export function isSessionFinalized(session: AssessmentSession): boolean {
  return session.status === "completed" && Boolean(session.completedAt);
}

export function pendingQuestionIds(session: AssessmentSession): string[] {
  const answered = new Set(session.responses.map((response) => response.questionId));
  return session.questions
    .map((question) => question.id)
    .filter((questionId) => !answered.has(questionId));
}

export function canRecordResponse(
  session: AssessmentSession,
  questionId: string,
  skill?: AssessmentSkill,
): boolean {
  if (isSessionFinalized(session)) {
    return false;
  }

  const question = session.questions.find((item) => item.id === questionId);
  if (!question) {
    return false;
  }

  if (skill && question.skill !== skill) {
    return false;
  }

  return !session.responses.some((response) => response.questionId === questionId);
}
