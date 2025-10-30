import type {
  ActiveRecallPhase,
  APALesson,
  AssimilationPhase,
  FeedbackNextPhase,
  PresentationPhase,
} from "../entities";
import { APA_PHASE_ORDER } from "../value-objects";

import { validateActiveRecallPhase } from "./active-recall-phase-validator";
import { validateAssimilationPhase } from "./assimilation-phase-validator";
import { validateFeedbackNextPhase } from "./feedback-next-phase-validator";
import { validateLinguisticObjective } from "./linguistic-objective-validator";
import { validatePhaseBase } from "./phase-base-validator";
import { validatePresentationPhase } from "./presentation-phase-validator";
import type { ValidationIssue, ValidationResult } from "./validation-types";
import { getValidationStatus } from "./validation-types";

export function validateAPALesson(lesson: APALesson): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!lesson.slug?.trim()) {
    issues.push({
      path: "lesson.slug",
      message: "Slug must be defined for routing and analytics.",
      severity: "error",
    });
  }

  if (!lesson.title?.trim()) {
    issues.push({
      path: "lesson.title",
      message: "Title must be provided so the lesson is identifiable.",
      severity: "error",
    });
  }

  issues.push(...validateLinguisticObjective(lesson.objective));

  const { phases } = lesson;
  const missingPhases = APA_PHASE_ORDER.filter((phaseType) => !phases[phaseType]);

  missingPhases.forEach((missingPhase) => {
    issues.push({
      path: `lesson.phases.${missingPhase}`,
      message: `Phase "${missingPhase}" is required in the APA flow.`,
      severity: "error",
    });
  });

  APA_PHASE_ORDER.forEach((phaseType) => {
    const phase = phases[phaseType];
    if (!phase) {
      return;
    }

    if (phase.type !== phaseType) {
      issues.push({
        path: `lesson.phases.${phaseType}.type`,
        message: `Phase type mismatch. Expected "${phaseType}" got "${phase.type}".`,
        severity: "error",
      });
    }

    const phasePath = `lesson.phases.${phaseType}`;
    issues.push(...validatePhaseBase(lesson, phase, phasePath));

    if (!phase.objectiveLinks.some((link) => link.objectiveId === lesson.objective.id)) {
      issues.push({
        path: `${phasePath}.objectiveLinks`,
        message: "At least one objective link must target the lesson objective.",
        severity: "error",
      });
    }

    switch (phaseType) {
      case "presentation":
        issues.push(...validatePresentationPhase(phase as PresentationPhase, phasePath));
        break;
      case "assimilation":
        issues.push(...validateAssimilationPhase(phase as AssimilationPhase, phasePath));
        break;
      case "activeRecall":
        issues.push(...validateActiveRecallPhase(phase as ActiveRecallPhase, phasePath));
        break;
      case "feedbackNext":
        issues.push(...validateFeedbackNextPhase(phase as FeedbackNextPhase, phasePath));
        break;
      default:
        break;
    }
  });

  const summedDurations = APA_PHASE_ORDER.reduce((total, phaseType) => {
    const phase = phases[phaseType];
    return phase ? total + phase.targetDurationMinutes : total;
  }, 0);

  if (
    typeof lesson.estimatedDurationMinutes === "number" &&
    lesson.estimatedDurationMinutes < summedDurations
  ) {
    issues.push({
      path: "lesson.estimatedDurationMinutes",
      message:
        "Estimated duration should be greater than or equal to the sum of the phase durations.",
      severity: "warning",
    });
  }

  return getValidationStatus(issues);
}
