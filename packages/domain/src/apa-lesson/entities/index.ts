import type { BaseEntity } from "../../core";
import type {
  APAPhaseType,
  FeedbackMode,
  LanguagePoint,
  LinguisticObjective,
  NextStepAction,
  PhaseObjectiveLink,
  PracticeActivity,
  PresentationMaterial,
  ResourceReference,
  RetrievalPrompt,
} from "../value-objects";

export interface APAPhaseBase {
  type: APAPhaseType;
  title: string;
  summary: string;
  targetDurationMinutes: number;
  objectiveLinks: PhaseObjectiveLink[];
  resources?: ResourceReference[];
}

export interface PresentationPhase extends APAPhaseBase {
  type: "presentation";
  materials: PresentationMaterial[];
  languageHighlights: LanguagePoint[];
  engagementChecks: string[];
}

export interface AssimilationPhase extends APAPhaseBase {
  type: "assimilation";
  practiceActivities: PracticeActivity[];
  scaffoldingStrategies?: string[];
}

export interface ActiveRecallPhase extends APAPhaseBase {
  type: "activeRecall";
  retrievalPrompts: RetrievalPrompt[];
  successChecks: string[];
  reflectionQuestions?: string[];
}

export interface FeedbackNextPhase extends APAPhaseBase {
  type: "feedbackNext";
  feedbackModes: FeedbackMode[];
  nextSteps: NextStepAction[];
  closureSummary?: string;
}

export type APAPhases = {
  presentation: PresentationPhase;
  assimilation: AssimilationPhase;
  activeRecall: ActiveRecallPhase;
  feedbackNext: FeedbackNextPhase;
};

export type APAPhase =
  | PresentationPhase
  | AssimilationPhase
  | ActiveRecallPhase
  | FeedbackNextPhase;

export interface APALesson extends BaseEntity {
  slug: string;
  title: string;
  objective: LinguisticObjective;
  phases: APAPhases;
  estimatedDurationMinutes?: number;
  tags?: string[];
  languageFocus?: {
    grammar?: string[];
    vocabulary?: string[];
    pronunciation?: string[];
  };
  notes?: string;
}
