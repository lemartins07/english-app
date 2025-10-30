import type { APALesson, APAPhaseBase } from "../entities";
import type { ObjectiveFocus } from "../value-objects";
import { OBJECTIVE_FOCUS_OPTIONS, RESOURCE_TYPES } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validatePhaseBase(
  lesson: APALesson,
  phase: APAPhaseBase,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!phase.title?.trim()) {
    issues.push({
      path: `${path}.title`,
      message: "Phase title is required for UI display.",
      severity: "error",
    });
  }

  if (!phase.summary?.trim()) {
    issues.push({
      path: `${path}.summary`,
      message: "Provide a short summary to guide facilitators.",
      severity: "error",
    });
  }

  if (!Number.isFinite(phase.targetDurationMinutes) || phase.targetDurationMinutes <= 0) {
    issues.push({
      path: `${path}.targetDurationMinutes`,
      message: "Phase duration must be a positive number.",
      severity: "error",
    });
  }

  if (!Array.isArray(phase.objectiveLinks) || phase.objectiveLinks.length === 0) {
    issues.push({
      path: `${path}.objectiveLinks`,
      message: "Each phase must reference at least one objective focus.",
      severity: "error",
    });
  } else {
    phase.objectiveLinks.forEach((link, index) => {
      if (!link.objectiveId?.trim()) {
        issues.push({
          path: `${path}.objectiveLinks[${index}].objectiveId`,
          message: "Objective link must specify the objective id.",
          severity: "error",
        });
      }

      if (!OBJECTIVE_FOCUS_OPTIONS.includes(link.focus)) {
        issues.push({
          path: `${path}.objectiveLinks[${index}].focus`,
          message: `Focus must be one of ${OBJECTIVE_FOCUS_OPTIONS.join(", ")}.`,
          severity: "error",
        });
      }
    });
  }

  phase.resources?.forEach((resource, index) => {
    if (!RESOURCE_TYPES.includes(resource.type)) {
      issues.push({
        path: `${path}.resources[${index}].type`,
        message: `Resource type must be one of ${RESOURCE_TYPES.join(", ")}.`,
        severity: "error",
      });
    }
    if (!resource.id?.trim()) {
      issues.push({
        path: `${path}.resources[${index}].id`,
        message: "Resource id is required for referencing.",
        severity: "error",
      });
    }
    if (!resource.label?.trim()) {
      issues.push({
        path: `${path}.resources[${index}].label`,
        message: "Resource label is required for facilitator visibility.",
        severity: "error",
      });
    }
  });

  if (
    lesson.objective.successCriteria.length > 0 &&
    !phase.objectiveLinks.some((link) =>
      hasMatchingFocusArea(lesson.objective.focusAreas, link.focus),
    )
  ) {
    issues.push({
      path: `${path}.objectiveLinks`,
      message: "At least one objective link should align with the objective focus areas.",
      severity: "warning",
    });
  }

  return issues;
}

function hasMatchingFocusArea(
  focusAreas: APALesson["objective"]["focusAreas"],
  focus: ObjectiveFocus,
): boolean {
  return focusAreas.some((area) => area.focus === focus);
}
