import type { CEFRLevel, CEFRScoreBand } from "../../shared/cefr";
import { findScoreBand } from "../../shared/cefr";

export const CEFR_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type CEFRConfidenceLevel = (typeof CEFR_CONFIDENCE_LEVELS)[number];

export interface CEFRDiagnosticProfile {
  level: CEFRLevel;
  score: number;
  band: CEFRScoreBand;
  confidence: CEFRConfidenceLevel;
  rationale: string[];
}

export interface CEFRDiagnosticProfileInput {
  score: number;
  band?: CEFRScoreBand;
  confidence?: CEFRConfidenceLevel;
  rationale?: string[];
}

export function createCEFRDiagnosticProfile(
  input: CEFRDiagnosticProfileInput,
): CEFRDiagnosticProfile {
  const { score } = input;

  if (Number.isNaN(score)) {
    throw new Error("CEFR diagnostic profiles require a valid numeric score.");
  }

  if (score < 0 || score > 100) {
    throw new Error("CEFR diagnostic scores must be within the 0-100 range.");
  }

  const roundedScore = Math.round(score);
  const band = input.band ?? findScoreBand(roundedScore);
  const confidence = input.confidence ?? "medium";

  if (!CEFR_CONFIDENCE_LEVELS.includes(confidence)) {
    throw new Error(`Unsupported confidence level "${confidence}" for CEFR diagnostics.`);
  }

  const rationale =
    input.rationale?.map((item) => item.trim()).filter((item) => item.length > 0) ?? [];

  return {
    level: band.level,
    score: roundedScore,
    band,
    confidence,
    rationale,
  };
}
