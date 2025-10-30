import type { LinguisticObjective } from "../value-objects";
import { CEFR_LEVELS, LINGUISTIC_SKILLS, OBJECTIVE_FOCUS_OPTIONS } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validateLinguisticObjective(objective: LinguisticObjective): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const path = "lesson.objective";

  if (!objective.id?.trim()) {
    issues.push({
      path: `${path}.id`,
      message: "Objective id must be defined.",
      severity: "error",
    });
  }

  if (!CEFR_LEVELS.includes(objective.cefrLevel)) {
    issues.push({
      path: `${path}.cefrLevel`,
      message: `CEFR level must be one of ${CEFR_LEVELS.join(", ")}.`,
      severity: "error",
    });
  }

  if (!LINGUISTIC_SKILLS.includes(objective.skill)) {
    issues.push({
      path: `${path}.skill`,
      message: `Skill must be one of ${LINGUISTIC_SKILLS.join(", ")}.`,
      severity: "error",
    });
  }

  if (!objective.title?.trim()) {
    issues.push({
      path: `${path}.title`,
      message: "Objective title is required.",
      severity: "error",
    });
  }

  if (!objective.description?.trim()) {
    issues.push({
      path: `${path}.description`,
      message: "Objective description is required.",
      severity: "error",
    });
  }

  if (!objective.targetLanguage?.trim()) {
    issues.push({
      path: `${path}.targetLanguage`,
      message: "Target language description is required.",
      severity: "error",
    });
  }

  if (!Array.isArray(objective.successCriteria) || objective.successCriteria.length === 0) {
    issues.push({
      path: `${path}.successCriteria`,
      message: "Provide at least one success criterion for assessment alignment.",
      severity: "error",
    });
  }

  if (!Array.isArray(objective.focusAreas) || objective.focusAreas.length === 0) {
    issues.push({
      path: `${path}.focusAreas`,
      message: "Specify focus areas to guide phase alignment.",
      severity: "error",
    });
  } else {
    objective.focusAreas.forEach((focusArea, index) => {
      if (!OBJECTIVE_FOCUS_OPTIONS.includes(focusArea.focus)) {
        issues.push({
          path: `${path}.focusAreas[${index}].focus`,
          message: `Focus must be one of ${OBJECTIVE_FOCUS_OPTIONS.join(", ")}.`,
          severity: "error",
        });
      }
      if (!Array.isArray(focusArea.descriptors) || focusArea.descriptors.length === 0) {
        issues.push({
          path: `${path}.focusAreas[${index}].descriptors`,
          message: "Each focus area requires at least one descriptor.",
          severity: "error",
        });
      }
    });
  }

  return issues;
}
