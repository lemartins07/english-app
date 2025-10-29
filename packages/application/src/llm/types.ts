export interface GeneratePlanInput {
  learner: {
    level: string;
    goals: string[];
    nativeLanguage?: string;
    constraints?: string[];
    availableHoursPerWeek?: number;
  };
  timeframeWeeks: number;
  priorKnowledge?: string;
  preferences?: {
    tone?: "formal" | "neutral" | "casual";
    focusAreas?: string[];
    contentTypes?: string[];
  };
  locale?: string;
}

export interface LessonActivity {
  type: string;
  description: string;
  durationMinutes: number;
  resources?: string[];
}

export interface LessonPlan {
  id: string;
  title: string;
  objective: string;
  summary: string;
  activities: LessonActivity[];
  homework?: string;
}

export interface WeeklyFocus {
  week: number;
  theme: string;
  objectives: string[];
  lessons: LessonPlan[];
}

export interface GeneratePlanResult {
  overview: string;
  rationale: string;
  metrics: {
    totalMinutes: number;
    estimatedCompletionWeeks: number;
  };
  weeks: WeeklyFocus[];
  recommendations?: string[];
}

export interface EvaluationCriterion {
  id: string;
  description: string;
  weight?: number;
  rubric?: string;
}

export interface EvaluateAnswerInput {
  question: string;
  answer: string;
  expectedAnswer?: string;
  evaluationCriteria: EvaluationCriterion[];
  locale?: string;
}

export interface EvaluateAnswerIssue {
  type: string;
  message: string;
  suggestion?: string;
}

export interface EvaluateAnswerResult {
  overallScore: number;
  grade?: string;
  strengths: string[];
  improvements: string[];
  issues: EvaluateAnswerIssue[];
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  weight?: number;
  expectations?: string;
}

export interface InterviewRubricEvalInput {
  transcript: string;
  rubric: RubricCriterion[];
  context?: {
    position?: string;
    seniority?: string;
    locale?: string;
  };
}

export interface RubricCriterionEvaluation {
  criterionId: string;
  score: number;
  evidence: string;
  notes?: string;
  actionItems?: string[];
}

export interface InterviewRubricEvalResult {
  overallScore: number;
  summary: string;
  criteria: RubricCriterionEvaluation[];
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatReplyInput {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatReply {
  message: ChatMessage;
  usage?: TokenUsage;
}
