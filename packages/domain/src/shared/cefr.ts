/**
 * Shared CEFR utilities so multiple bounded contexts reuse the same ubiquitous language.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

const LEVEL_ORDER = new Map<CEFRLevel, number>(CEFR_LEVELS.map((level, index) => [level, index]));

export function isValidCEFRLevel(level: unknown): level is CEFRLevel {
  return typeof level === "string" && LEVEL_ORDER.has(level as CEFRLevel);
}

export function compareCEFRLevels(a: CEFRLevel, b: CEFRLevel): number {
  return (LEVEL_ORDER.get(a) ?? 0) - (LEVEL_ORDER.get(b) ?? 0);
}

export interface CEFRScoreBand {
  level: CEFRLevel;
  /**
   * Minimum score (inclusive) used by the diagnostic to map numeric performance to CEFR.
   */
  minScore: number;
  /**
   * Maximum score (inclusive) used by the diagnostic to map numeric performance to CEFR.
   */
  maxScore: number;
  /**
   * Friendly label for UI summaries (e.g. "Beginner", "Upper Intermediate").
   */
  label: string;
  /**
   * Short explanation contextualising what the level means for the learner.
   */
  description: string;
}

export interface CEFRScoreBandProps {
  level: CEFRLevel;
  minScore: number;
  maxScore: number;
  label: string;
  description: string;
}

export function createCEFRScoreBand(props: CEFRScoreBandProps): CEFRScoreBand {
  const { minScore, maxScore } = props;

  if (Number.isNaN(minScore) || Number.isNaN(maxScore)) {
    throw new Error("CEFR score band must have numeric min and max scores.");
  }

  if (minScore < 0 || maxScore > 100) {
    throw new Error("CEFR score band scores must be within the 0-100 range.");
  }

  if (minScore > maxScore) {
    throw new Error("CEFR score band minimum score cannot exceed the maximum score.");
  }

  return {
    ...props,
    minScore: Math.round(minScore),
    maxScore: Math.round(maxScore),
  };
}

export const DEFAULT_CEFR_SCORE_BANDS: CEFRScoreBand[] = [
  createCEFRScoreBand({
    level: "A1",
    minScore: 0,
    maxScore: 20,
    label: "Beginner",
    description: "Comunica ideias básicas com frases memorizadas e vocabulário simples.",
  }),
  createCEFRScoreBand({
    level: "A2",
    minScore: 21,
    maxScore: 40,
    label: "Elementary",
    description: "Compreende tópicos familiares e faz perguntas simples sobre rotinas.",
  }),
  createCEFRScoreBand({
    level: "B1",
    minScore: 41,
    maxScore: 60,
    label: "Intermediate",
    description: "Desenvolve conversas previsíveis e descreve experiências com alguma fluência.",
  }),
  createCEFRScoreBand({
    level: "B2",
    minScore: 61,
    maxScore: 75,
    label: "Upper Intermediate",
    description: "Argumenta sobre temas técnicos com boa fluência e vocabulário funcional.",
  }),
  createCEFRScoreBand({
    level: "C1",
    minScore: 76,
    maxScore: 90,
    label: "Advanced",
    description:
      "Demonstra flexibilidade discursiva e precisão em contextos profissionais complexos.",
  }),
  createCEFRScoreBand({
    level: "C2",
    minScore: 91,
    maxScore: 100,
    label: "Proficient",
    description:
      "Se comunica com naturalidade e nuance, similar a um falante nativo em situações desafiadoras.",
  }),
];

export function findScoreBand(
  score: number,
  bands: CEFRScoreBand[] = DEFAULT_CEFR_SCORE_BANDS,
): CEFRScoreBand {
  if (Number.isNaN(score)) {
    throw new Error("Score must be a numeric value to determine a CEFR band.");
  }

  if (score < 0 || score > 100) {
    throw new Error("Score must be within the 0-100 range to map to CEFR levels.");
  }

  const normalizedScore = Math.round(score);
  const matchingBand = bands.find(
    (band) => normalizedScore >= band.minScore && normalizedScore <= band.maxScore,
  );

  if (!matchingBand) {
    const highestBand = [...bands].sort((a, b) => compareCEFRLevels(b.level, a.level))[0];
    if (!highestBand) {
      throw new Error("No CEFR bands configured.");
    }

    return highestBand;
  }

  return matchingBand;
}
