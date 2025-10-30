import type { FeedbackNextPhase } from "../entities";
import { FEEDBACK_ACTORS, FEEDBACK_CHANNELS, NEXT_STEP_FOCUS_OPTIONS } from "../value-objects";

import type { ValidationIssue } from "./validation-types";

export function validateFeedbackNextPhase(
  phase: FeedbackNextPhase,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(phase.feedbackModes) || phase.feedbackModes.length === 0) {
    issues.push({
      path: `${path}.feedbackModes`,
      message: "Specify how feedback will be delivered.",
      severity: "error",
    });
  } else {
    phase.feedbackModes.forEach((mode, index) => {
      if (!FEEDBACK_ACTORS.includes(mode.actor)) {
        issues.push({
          path: `${path}.feedbackModes[${index}].actor`,
          message: `Feedback actor must be one of ${FEEDBACK_ACTORS.join(", ")}.`,
          severity: "error",
        });
      }
      if (!FEEDBACK_CHANNELS.includes(mode.channel)) {
        issues.push({
          path: `${path}.feedbackModes[${index}].channel`,
          message: `Feedback channel must be one of ${FEEDBACK_CHANNELS.join(", ")}.`,
          severity: "error",
        });
      }
      if (!Array.isArray(mode.focus) || mode.focus.length === 0) {
        issues.push({
          path: `${path}.feedbackModes[${index}].focus`,
          message: "Feedback focus should reference objective areas.",
          severity: "error",
        });
      }
    });
  }

  if (!Array.isArray(phase.nextSteps) || phase.nextSteps.length === 0) {
    issues.push({
      path: `${path}.nextSteps`,
      message: "Plan concrete next steps to close the loop.",
      severity: "error",
    });
  } else {
    phase.nextSteps.forEach((step, index) => {
      if (!step.id?.trim()) {
        issues.push({
          path: `${path}.nextSteps[${index}].id`,
          message: "Next step id must be provided.",
          severity: "error",
        });
      }
      if (!NEXT_STEP_FOCUS_OPTIONS.includes(step.focus)) {
        issues.push({
          path: `${path}.nextSteps[${index}].focus`,
          message: `Next step focus must be one of ${NEXT_STEP_FOCUS_OPTIONS.join(", ")}.`,
          severity: "error",
        });
      }
      if (!step.instructions?.trim()) {
        issues.push({
          path: `${path}.nextSteps[${index}].instructions`,
          message: "Describe the next step instructions.",
          severity: "error",
        });
      }
    });
  }

  return issues;
}
