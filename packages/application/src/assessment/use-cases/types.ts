import type {
  AssessmentSession,
  CEFRLevel,
  ISODateString,
  ShortAudioFileRef,
} from "@english-app/domain";

export interface StartAssessmentInput {
  userId: string;
  blueprintId: string;
  requestedAt: ISODateString;
  targetLevel?: CEFRLevel;
  metadata?: Record<string, unknown>;
}

export interface StartAssessmentResult {
  sessionId: string;
  session: AssessmentSession;
}

export interface SubmitAssessmentResponseBase {
  sessionId: string;
  questionId: string;
  submittedAt: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface SubmitMultipleChoiceResponseInput extends SubmitAssessmentResponseBase {
  type: "multipleChoice";
  selectedOptionIds: string[];
  confidence?: number;
}

export interface SubmitListeningResponseInput extends SubmitAssessmentResponseBase {
  type: "listening";
  selectedOptionIds?: string[];
  notes?: string;
  confidence?: number;
}

export interface SubmitSpeakingResponseInput extends SubmitAssessmentResponseBase {
  type: "speaking";
  audio: ShortAudioFileRef;
  localeHint?: string;
  prompt?: string;
}

export type SubmitAssessmentResponseInput =
  | SubmitMultipleChoiceResponseInput
  | SubmitListeningResponseInput
  | SubmitSpeakingResponseInput;

export interface SubmitAssessmentResponseResult {
  sessionId: string;
  questionId: string;
  totalResponses: number;
}

export interface FinalizeAssessmentInput {
  sessionId: string;
  requestedAt: ISODateString;
}

export interface FinalizeAssessmentResult {
  sessionId: string;
  recommendedLevel: string;
}
