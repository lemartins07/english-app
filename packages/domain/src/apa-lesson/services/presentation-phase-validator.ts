import type { PresentationPhase } from "../entities";
import { PRESENTATION_MATERIAL_TYPES } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validatePresentationPhase(
  phase: PresentationPhase,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(phase.materials) || phase.materials.length === 0) {
    issues.push({
      path: `${path}.materials`,
      message: "Presentation materials are required to anchor input.",
      severity: "error",
    });
  } else {
    phase.materials.forEach((material, index) => {
      if (!PRESENTATION_MATERIAL_TYPES.includes(material.type)) {
        issues.push({
          path: `${path}.materials[${index}].type`,
          message: `Material type must be one of ${PRESENTATION_MATERIAL_TYPES.join(", ")}.`,
          severity: "error",
        });
      }
      if (!material.id?.trim()) {
        issues.push({
          path: `${path}.materials[${index}].id`,
          message: "Material id must be provided.",
          severity: "error",
        });
      }
      if (!material.title?.trim()) {
        issues.push({
          path: `${path}.materials[${index}].title`,
          message: "Material title is required.",
          severity: "error",
        });
      }
      if (!material.description?.trim()) {
        issues.push({
          path: `${path}.materials[${index}].description`,
          message: "Material description is required.",
          severity: "error",
        });
      }
    });
  }

  if (!Array.isArray(phase.languageHighlights) || phase.languageHighlights.length === 0) {
    issues.push({
      path: `${path}.languageHighlights`,
      message: "Highlight the key language the objective targets.",
      severity: "error",
    });
  }

  if (!Array.isArray(phase.engagementChecks) || phase.engagementChecks.length === 0) {
    issues.push({
      path: `${path}.engagementChecks`,
      message: "Provide engagement checks to confirm learners follow the presentation.",
      severity: "warning",
    });
  }

  return issues;
}
