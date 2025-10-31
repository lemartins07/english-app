import type { CEFRLevel } from "../apa-lesson/value-objects";
import type { BaseEntity, ISODateString } from "../core";

export type AssessmentType = "LEVELING";

export type AssessmentSessionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type AssessmentQuestionType = "MCQ" | "LISTENING" | "SPEAKING" | "WRITING";

export type { CEFRLevel };

export interface AssessmentSessionEntity extends BaseEntity {
  userId: string;
  type: AssessmentType;
  status: AssessmentSessionStatus;
  startedAt: ISODateString;
  completedAt?: ISODateString;
  expiresAt?: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface AssessmentAnswerEntity extends BaseEntity {
  sessionId: string;
  questionId: string;
  questionType: AssessmentQuestionType;
  content: unknown;
  evaluation?: unknown;
  score?: number;
  maxScore?: number;
  durationSec?: number;
}

export interface AssessmentResultEntity extends BaseEntity {
  sessionId: string;
  level: CEFRLevel;
  overallScore?: number;
  skillScores?: Record<string, number>;
  strengths?: string[];
  areasToImprove?: string[];
  recommendations?: string[];
  summary?: string;
}
