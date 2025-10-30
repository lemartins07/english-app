import type { ActiveRecallPhase } from "../entities";
import { RETRIEVAL_PROMPT_FORMATS, SUPPORT_LEVELS } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validateActiveRecallPhase(
  phase: ActiveRecallPhase,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(phase.retrievalPrompts) || phase.retrievalPrompts.length === 0) {
    issues.push({
      path: `${path}.retrievalPrompts`,
      message: "Add retrieval prompts to trigger active recall.",
      severity: "error",
    });
  } else {
    phase.retrievalPrompts.forEach((prompt, index) => {
      if (!prompt.id?.trim()) {
        issues.push({
          path: `${path}.retrievalPrompts[${index}].id`,
          message: "Retrieval prompt id must be provided.",
          severity: "error",
        });
      }
      if (!RETRIEVAL_PROMPT_FORMATS.includes(prompt.format)) {
        issues.push({
          path: `${path}.retrievalPrompts[${index}].format`,
          message: `Prompt format must be one of ${RETRIEVAL_PROMPT_FORMATS.join(", ")}.`,
          severity: "error",
        });
      }
      if (!prompt.prompt?.trim()) {
        issues.push({
          path: `${path}.retrievalPrompts[${index}].prompt`,
          message: "Retrieval prompt value is required.",
          severity: "error",
        });
      }
      if (!SUPPORT_LEVELS.includes(prompt.supportLevel)) {
        issues.push({
          path: `${path}.retrievalPrompts[${index}].supportLevel`,
          message: "Support level must be minimal, guided, or full.",
          severity: "error",
        });
      }
    });
  }

  if (!Array.isArray(phase.successChecks) || phase.successChecks.length === 0) {
    issues.push({
      path: `${path}.successChecks`,
      message: "Define how recall will be verified.",
      severity: "error",
    });
  }

  return issues;
}
