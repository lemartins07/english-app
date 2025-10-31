import type { CEFRScoreBand } from "../../shared/cefr";
import type { CEFRConfidenceLevel, CEFRDiagnosticProfile } from "../value-objects/cefr";
import { createCEFRDiagnosticProfile } from "../value-objects/cefr";
import type { AssessmentSkill } from "../value-objects/questions";

export interface SkillDiagnostic {
  skill: AssessmentSkill;
  profile: CEFRDiagnosticProfile;
  percentile?: number;
  strengths: string[];
  improvements: string[];
}

export interface SkillDiagnosticInput {
  skill: AssessmentSkill;
  score: number;
  confidence?: CEFRConfidenceLevel;
  band?: CEFRScoreBand;
  rationale?: string[];
  percentile?: number;
  strengths?: string[];
  improvements?: string[];
}

export interface AssessmentDiagnostic {
  overall: CEFRDiagnosticProfile;
  skills: SkillDiagnostic[];
  recommendations: string[];
  notes?: string;
}

export interface AssessmentDiagnosticInput {
  score: number;
  confidence?: CEFRConfidenceLevel;
  band?: CEFRScoreBand;
  rationale?: string[];
  skills: SkillDiagnosticInput[];
  recommendations?: string[];
  notes?: string;
}

function normalizeTextList(values?: string[]): string[] {
  return values?.map((value) => value.trim()).filter((value) => value.length > 0) ?? [];
}

function sanitizePercentile(percentile: number | undefined): number | undefined {
  if (percentile === undefined) {
    return undefined;
  }

  if (Number.isNaN(percentile)) {
    throw new Error("Percentile must be a numeric value.");
  }

  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile values must be between 0 and 100.");
  }

  return Math.round(percentile * 10) / 10;
}

export function createSkillDiagnostic(input: SkillDiagnosticInput): SkillDiagnostic {
  const profile = createCEFRDiagnosticProfile({
    score: input.score,
    confidence: input.confidence,
    band: input.band,
    rationale: input.rationale,
  });

  return {
    skill: input.skill,
    profile,
    percentile: sanitizePercentile(input.percentile),
    strengths: normalizeTextList(input.strengths),
    improvements: normalizeTextList(input.improvements),
  };
}

export function createAssessmentDiagnostic(input: AssessmentDiagnosticInput): AssessmentDiagnostic {
  if (!input.skills.length) {
    throw new Error("Assessments diagnostics must include at least one skill diagnostic.");
  }

  const overall = createCEFRDiagnosticProfile({
    score: input.score,
    confidence: input.confidence,
    band: input.band,
    rationale: input.rationale,
  });

  const skills = input.skills.map((skill) => createSkillDiagnostic(skill));

  const seenSkills = new Set<AssessmentSkill>();
  skills.forEach((skill) => {
    if (seenSkills.has(skill.skill)) {
      throw new Error("Skill diagnostics must reference unique skills.");
    }

    seenSkills.add(skill.skill);
  });

  return {
    overall,
    skills,
    recommendations: normalizeTextList(input.recommendations),
    notes: input.notes?.trim(),
  };
}

export function getSkillDiagnostic(
  diagnostic: AssessmentDiagnostic,
  skill: AssessmentSkill,
): SkillDiagnostic | undefined {
  return diagnostic.skills.find((item) => item.skill === skill);
}
