import { CEFR_LEVELS, type CEFRLevel } from "../../shared/cefr";

const MAX_WEIGHT = 100;
const MIN_WEIGHT = 0.1;

export const ASSESSMENT_QUESTION_TYPES = ["multipleChoice", "listening", "speaking"] as const;
type AssessmentQuestionType = (typeof ASSESSMENT_QUESTION_TYPES)[number];

export const ASSESSMENT_SKILLS = [
  "listening",
  "speaking",
  "reading",
  "writing",
  "grammar",
  "vocabulary",
] as const;

export type AssessmentSkill = (typeof ASSESSMENT_SKILLS)[number];

export interface AssessmentQuestionBase {
  id: string;
  title: string;
  type: AssessmentQuestionType;
  skill: AssessmentSkill;
  cefrLevel: CEFRLevel;
  /**
   * Weight represents the percentual contribution (0-100) of the question to the final score.
   */
  weight: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface MultipleChoiceOption {
  id: string;
  label: string;
  text: string;
  rationale?: string;
}

export interface MultipleChoiceQuestion extends AssessmentQuestionBase {
  type: "multipleChoice";
  stem: string;
  options: MultipleChoiceOption[];
  /**
   * Correct options are stored as IDs and kept out of DTO responses.
   */
  correctOptionIds: string[];
  explanation?: string;
}

export interface ListeningStimulus {
  audioUrl: string;
  transcript?: string;
}

export interface ListeningQuestion extends AssessmentQuestionBase {
  type: "listening";
  prompt: string;
  stimulus: ListeningStimulus;
  options?: MultipleChoiceOption[];
  correctOptionIds?: string[];
  followUpPrompt?: string;
}

export interface SpeakingPrompt {
  context: string;
  instruction: string;
  hints: string[];
}

export interface SpeakingQuestion extends AssessmentQuestionBase {
  type: "speaking";
  prompt: SpeakingPrompt;
  rubricCriterionIds: string[];
  expectedDurationSeconds?: number;
}

export type AssessmentQuestion = MultipleChoiceQuestion | ListeningQuestion | SpeakingQuestion;

export interface MultipleChoiceQuestionInput {
  id: string;
  title: string;
  skill: AssessmentSkill;
  cefrLevel: CEFRLevel;
  weight: number;
  stem: string;
  options: MultipleChoiceOption[];
  correctOptionIds: string[];
  explanation?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ListeningQuestionInput {
  id: string;
  title: string;
  skill: AssessmentSkill;
  cefrLevel: CEFRLevel;
  weight: number;
  prompt: string;
  stimulus: ListeningStimulus;
  options?: MultipleChoiceOption[];
  correctOptionIds?: string[];
  followUpPrompt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SpeakingQuestionInput {
  id: string;
  title: string;
  skill: Extract<AssessmentSkill, "speaking">;
  cefrLevel: CEFRLevel;
  weight: number;
  prompt: SpeakingPrompt;
  rubricCriterionIds: string[];
  expectedDurationSeconds?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

function sanitizeWeight(weight: number): number {
  if (Number.isNaN(weight)) {
    throw new Error("Question weight must be a numeric value.");
  }

  if (weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
    throw new Error(`Question weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`);
  }

  return Math.round(weight * 100) / 100;
}

function ensureCEFRLevel(level: CEFRLevel): CEFRLevel {
  if (!CEFR_LEVELS.includes(level)) {
    throw new Error(`Unsupported CEFR level "${level}" for assessment question.`);
  }

  return level;
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  tags.forEach((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) {
      return;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    normalized.push(trimmed);
  });

  return normalized;
}

function assertOptions(
  options: MultipleChoiceOption[] | undefined,
  context: "listening" | "multipleChoice",
): MultipleChoiceOption[] | undefined {
  if (!options) {
    return undefined;
  }

  if (options.length < 2) {
    throw new Error(`${context} questions must provide at least two answer options.`);
  }

  const normalized = options.map((option) => {
    if (!option.id.trim()) {
      throw new Error("Multiple choice options must have a non-empty id.");
    }

    if (!option.text.trim()) {
      throw new Error("Multiple choice options must include display text.");
    }

    return {
      ...option,
      label: option.label.trim() || option.text.slice(0, 48),
      rationale: option.rationale?.trim(),
    };
  });

  const duplicates = new Set<string>();
  normalized.forEach((option) => {
    if (duplicates.has(option.id)) {
      throw new Error(`Multiple choice options must have unique ids. Duplicate "${option.id}".`);
    }

    duplicates.add(option.id);
  });

  return normalized;
}

function assertCorrectOptionIds(
  correctOptionIds: string[] | undefined,
  options: MultipleChoiceOption[] | undefined,
  context: "listening" | "multipleChoice",
): string[] | undefined {
  if (!options) {
    return undefined;
  }

  if (!correctOptionIds?.length) {
    throw new Error(`${context} questions must declare at least one correct option id.`);
  }

  const optionIds = new Set(options.map((option) => option.id));
  const normalized = correctOptionIds.map((id) => id.trim());

  normalized.forEach((id) => {
    if (!optionIds.has(id)) {
      throw new Error(
        `${context} question correct option "${id}" is not present in the available options.`,
      );
    }
  });

  return Array.from(new Set(normalized));
}

function assertSpeakingPrompt(prompt: SpeakingPrompt): SpeakingPrompt {
  if (!prompt.context?.trim()) {
    throw new Error("Speaking prompts must describe a scenario or context.");
  }

  if (!prompt.instruction?.trim()) {
    throw new Error("Speaking prompts must include an instruction for the learner.");
  }

  return {
    context: prompt.context.trim(),
    instruction: prompt.instruction.trim(),
    hints: prompt.hints?.map((hint) => hint.trim()).filter((hint) => hint.length > 0) ?? [],
  };
}

export function createMultipleChoiceQuestion(
  input: MultipleChoiceQuestionInput,
): MultipleChoiceQuestion {
  const options = assertOptions(input.options, "multipleChoice")!;
  const correctOptionIds = assertCorrectOptionIds(
    input.correctOptionIds,
    options,
    "multipleChoice",
  )!;

  return {
    id: input.id,
    title: input.title.trim(),
    type: "multipleChoice",
    skill: input.skill,
    cefrLevel: ensureCEFRLevel(input.cefrLevel),
    weight: sanitizeWeight(input.weight),
    tags: normalizeTags(input.tags),
    metadata: input.metadata,
    stem: input.stem.trim(),
    options,
    correctOptionIds,
    explanation: input.explanation?.trim(),
  };
}

export function createListeningQuestion(input: ListeningQuestionInput): ListeningQuestion {
  if (!input.stimulus?.audioUrl?.trim()) {
    throw new Error("Listening questions must include an audio URL stimulus.");
  }

  const options = assertOptions(input.options, "listening");
  const correctOptionIds =
    options && input.correctOptionIds
      ? assertCorrectOptionIds(input.correctOptionIds, options, "listening")
      : undefined;

  return {
    id: input.id,
    title: input.title.trim(),
    type: "listening",
    skill: input.skill,
    cefrLevel: ensureCEFRLevel(input.cefrLevel),
    weight: sanitizeWeight(input.weight),
    tags: normalizeTags(input.tags),
    metadata: input.metadata,
    prompt: input.prompt.trim(),
    stimulus: {
      audioUrl: input.stimulus.audioUrl.trim(),
      transcript: input.stimulus.transcript?.trim(),
    },
    options,
    correctOptionIds,
    followUpPrompt: input.followUpPrompt?.trim(),
  };
}

export function createSpeakingQuestion(input: SpeakingQuestionInput): SpeakingQuestion {
  if (!input.rubricCriterionIds?.length) {
    throw new Error("Speaking questions must reference at least one rubric criterion.");
  }

  const normalizedCriterionIds = Array.from(
    new Set(input.rubricCriterionIds.map((id) => id.trim())),
  ).filter((id) => id.length > 0);

  if (!normalizedCriterionIds.length) {
    throw new Error("Speaking questions must reference valid rubric criterion ids.");
  }

  return {
    id: input.id,
    title: input.title.trim(),
    type: "speaking",
    skill: "speaking",
    cefrLevel: ensureCEFRLevel(input.cefrLevel),
    weight: sanitizeWeight(input.weight),
    tags: normalizeTags(input.tags),
    metadata: input.metadata,
    prompt: assertSpeakingPrompt(input.prompt),
    rubricCriterionIds: normalizedCriterionIds,
    expectedDurationSeconds:
      typeof input.expectedDurationSeconds === "number"
        ? Math.max(30, Math.min(600, Math.round(input.expectedDurationSeconds)))
        : undefined,
  };
}

export function calculateQuestionSetWeight(questions: AssessmentQuestion[]): number {
  return Math.round(questions.reduce((total, question) => total + question.weight, 0) * 100) / 100;
}

export function ensureAssessmentQuestionSet(questions: AssessmentQuestion[]): void {
  if (!questions.length) {
    throw new Error("Assessment blueprints must include at least one question.");
  }

  const seenIds = new Set<string>();

  questions.forEach((question) => {
    if (seenIds.has(question.id)) {
      throw new Error(`Assessment questions must have unique ids. Duplicate "${question.id}".`);
    }

    seenIds.add(question.id);

    if (question.weight < MIN_WEIGHT || question.weight > MAX_WEIGHT) {
      throw new Error(
        `Assessment question "${question.id}" has an invalid weight "${question.weight}".`,
      );
    }
  });

  const totalWeight = calculateQuestionSetWeight(questions);
  if (totalWeight > 100.001) {
    throw new Error(
      `Assessment question weights exceed 100%. Current total: ${totalWeight.toFixed(2)}%.`,
    );
  }
}
