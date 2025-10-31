import type { AssessmentSkill } from "./questions";

const MAX_WEIGHT = 100;
const MIN_WEIGHT = 1;

export const RUBRIC_PERFORMANCE_LEVELS = [
  "needsSupport",
  "emerging",
  "proficient",
  "advanced",
] as const;

export type RubricPerformanceLevel = (typeof RUBRIC_PERFORMANCE_LEVELS)[number];

export interface RubricDescriptor {
  level: RubricPerformanceLevel;
  minScore: number;
  maxScore: number;
  descriptor: string;
  evidenceExamples: string[];
}

export interface AssessmentCriterion {
  id: string;
  title: string;
  skill: AssessmentSkill;
  focus: string;
  weight: number;
  descriptors: RubricDescriptor[];
}

export interface AssessmentCriterionInput {
  id: string;
  title: string;
  skill: AssessmentSkill;
  focus: string;
  weight: number;
  descriptors: RubricDescriptor[];
}

function sanitizeWeight(weight: number): number {
  if (Number.isNaN(weight)) {
    throw new Error("Criterion weight must be a numeric value.");
  }

  if (weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
    throw new Error(`Criterion weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`);
  }

  return Math.round(weight * 100) / 100;
}

function assertDescriptors(descriptors: RubricDescriptor[]): RubricDescriptor[] {
  if (!descriptors.length) {
    throw new Error("Rubric criteria must contain at least one descriptor.");
  }

  const seenLevels = new Set<RubricPerformanceLevel>();

  const sanitized = descriptors.map((descriptor) => {
    if (!descriptor.descriptor?.trim()) {
      throw new Error("Rubric descriptors must include descriptive guidance.");
    }

    if (descriptor.minScore < 0 || descriptor.maxScore > 100) {
      throw new Error("Rubric descriptor score ranges must stay within 0-100.");
    }

    if (descriptor.minScore > descriptor.maxScore) {
      throw new Error("Rubric descriptor minimum score cannot exceed maximum score.");
    }

    if (!RUBRIC_PERFORMANCE_LEVELS.includes(descriptor.level)) {
      throw new Error(`Unsupported rubric performance level "${descriptor.level}".`);
    }

    if (seenLevels.has(descriptor.level)) {
      throw new Error(`Rubric descriptors must have unique performance levels.`);
    }

    seenLevels.add(descriptor.level);

    return {
      ...descriptor,
      minScore: Math.round(descriptor.minScore),
      maxScore: Math.round(descriptor.maxScore),
      descriptor: descriptor.descriptor.trim(),
      evidenceExamples:
        descriptor.evidenceExamples?.map((evidence) => evidence.trim()).filter(Boolean) ?? [],
    };
  });

  const sorted = [...sanitized].sort((a, b) => a.minScore - b.minScore);

  sorted.forEach((descriptor, index) => {
    const next = sorted[index + 1];
    if (!next) {
      return;
    }

    if (descriptor.maxScore >= next.minScore) {
      throw new Error("Rubric descriptor score ranges cannot overlap.");
    }
  });

  return sorted;
}

export function createAssessmentCriterion(input: AssessmentCriterionInput): AssessmentCriterion {
  return {
    id: input.id,
    title: input.title.trim(),
    skill: input.skill,
    focus: input.focus.trim(),
    weight: sanitizeWeight(input.weight),
    descriptors: assertDescriptors(input.descriptors),
  };
}
