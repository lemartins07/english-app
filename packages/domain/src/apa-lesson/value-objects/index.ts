import type { ISODateString } from "../../core";

export const APA_PHASE_ORDER = [
  "presentation",
  "assimilation",
  "activeRecall",
  "feedbackNext",
] as const;

export type APAPhaseType = (typeof APA_PHASE_ORDER)[number];

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export const LINGUISTIC_SKILLS = [
  "listening",
  "speaking",
  "reading",
  "writing",
  "grammar",
  "vocabulary",
  "pronunciation",
] as const;

export type LinguisticSkill = (typeof LINGUISTIC_SKILLS)[number];

export const OBJECTIVE_FOCUS_OPTIONS = ["form", "meaning", "use", "skill", "strategy"] as const;
export type ObjectiveFocus = (typeof OBJECTIVE_FOCUS_OPTIONS)[number];

export const RESOURCE_TYPES = [
  "text",
  "audio",
  "video",
  "image",
  "slide",
  "activity",
  "link",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface ResourceReference {
  id: string;
  type: ResourceType;
  label: string;
  uri?: string;
  notes?: string;
}

export interface ObjectiveFocusArea {
  focus: ObjectiveFocus;
  descriptors: string[];
  canDoExample?: string;
}

export interface LinguisticObjective {
  id: string;
  skill: LinguisticSkill;
  cefrLevel: CEFRLevel;
  title: string;
  description: string;
  targetLanguage: string;
  successCriteria: string[];
  focusAreas: ObjectiveFocusArea[];
  prerequisiteKnowledge?: string[];
}

export interface PhaseObjectiveLink {
  objectiveId: string;
  focus: ObjectiveFocus;
  description?: string;
}

export const PRESENTATION_MATERIAL_TYPES = [
  "dialogue",
  "narrative",
  "explanation",
  "visual",
  "audio",
  "video",
] as const;

export type PresentationMaterialType = (typeof PRESENTATION_MATERIAL_TYPES)[number];

export interface PresentationMaterial {
  id: string;
  type: PresentationMaterialType;
  title: string;
  description: string;
  uri?: string;
  languageNotes?: string[];
}

export interface LanguagePoint {
  form: string;
  meaning?: string;
  useCases?: string[];
  pronunciationTips?: string[];
}

export const PRACTICE_MODES = ["solo", "pair", "group", "wholeClass"] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];

export interface PracticePrompt {
  model?: string;
  prompt: string;
  expectedResponse?: string;
}

export interface PracticeActivity {
  id: string;
  mode: PracticeMode;
  instructions: string;
  prompts: PracticePrompt[];
  successCriteria: string[];
  differentiationStrategies?: string[];
}

export const RETRIEVAL_PROMPT_FORMATS = [
  "oral",
  "written",
  "quiz",
  "flashcard",
  "rolePlay",
  "simulation",
] as const;

export type RetrievalPromptFormat = (typeof RETRIEVAL_PROMPT_FORMATS)[number];

export const SUPPORT_LEVELS = ["minimal", "guided", "full"] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export interface RetrievalPrompt {
  id: string;
  format: RetrievalPromptFormat;
  prompt: string;
  supportLevel: SupportLevel;
  expectedKeyLanguage?: string[];
}

export const FEEDBACK_ACTORS = ["teacher", "peer", "self", "aiCoach"] as const;
export type FeedbackActor = (typeof FEEDBACK_ACTORS)[number];

export const FEEDBACK_CHANNELS = ["oral", "written", "rubric", "annotation"] as const;
export type FeedbackChannel = (typeof FEEDBACK_CHANNELS)[number];

export interface FeedbackMode {
  actor: FeedbackActor;
  channel: FeedbackChannel;
  focus: ObjectiveFocus[];
  tools?: string[];
  notes?: string;
}

export const NEXT_STEP_FOCUS_OPTIONS = [
  "reteach",
  "extend",
  "assessment",
  "spacedReview",
  "assignment",
] as const;

export type NextStepFocus = (typeof NEXT_STEP_FOCUS_OPTIONS)[number];

export interface NextStepAction {
  id: string;
  focus: NextStepFocus;
  instructions: string;
  dueDate?: ISODateString;
  resources?: ResourceReference[];
}
