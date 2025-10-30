import type { AssimilationPhase } from "../entities";
import { PRACTICE_MODES } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validateAssimilationPhase(
  phase: AssimilationPhase,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(phase.practiceActivities) || phase.practiceActivities.length === 0) {
    issues.push({
      path: `${path}.practiceActivities`,
      message: "Create at least one practice activity to consolidate input.",
      severity: "error",
    });
  } else {
    phase.practiceActivities.forEach((activity, index) => {
      if (!activity.id?.trim()) {
        issues.push({
          path: `${path}.practiceActivities[${index}].id`,
          message: "Practice activity id is required.",
          severity: "error",
        });
      }
      if (!PRACTICE_MODES.includes(activity.mode)) {
        issues.push({
          path: `${path}.practiceActivities[${index}].mode`,
          message: `Practice mode must be one of ${PRACTICE_MODES.join(", ")}.`,
          severity: "error",
        });
      }
      if (!activity.instructions?.trim()) {
        issues.push({
          path: `${path}.practiceActivities[${index}].instructions`,
          message: "Instructions need to be explicit for facilitators.",
          severity: "error",
        });
      }
      if (!Array.isArray(activity.prompts) || activity.prompts.length === 0) {
        issues.push({
          path: `${path}.practiceActivities[${index}].prompts`,
          message: "Include prompts or models for guided practice.",
          severity: "error",
        });
      }
      if (!Array.isArray(activity.successCriteria) || activity.successCriteria.length === 0) {
        issues.push({
          path: `${path}.practiceActivities[${index}].successCriteria`,
          message: "Define how success is observed for each activity.",
          severity: "error",
        });
      }
    });
  }

  return issues;
}
