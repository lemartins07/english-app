import type {
  ActiveRecallPhase,
  APALesson,
  APAPhaseBase,
  AssimilationPhase,
  FeedbackNextPhase,
  PresentationPhase,
} from "../entities";
import type { APAPhaseType, LinguisticObjective } from "../value-objects";

import { validateActiveRecallPhase as validateActiveRecallPhaseDetails } from "./active-recall-phase-validator";
import { validateAssimilationPhase as validateAssimilationPhaseDetails } from "./assimilation-phase-validator";
import { validateFeedbackNextPhase as validateFeedbackNextPhaseDetails } from "./feedback-next-phase-validator";
import { validateAPALesson } from "./lesson-validator";
import { validateLinguisticObjective } from "./linguistic-objective-validator";
import { validatePhaseBase as validatePhaseBaseDetails } from "./phase-base-validator";
import { validatePresentationPhase as validatePresentationPhaseDetails } from "./presentation-phase-validator";
import type { ValidationIssue, ValidationResult } from "./validation-types";

export interface APALessonValidationService {
  validateLesson(lesson: APALesson): ValidationResult;
  validateObjective(objective: LinguisticObjective): ValidationIssue[];
  validatePhaseBase(
    lesson: APALesson,
    phase: APAPhaseBase,
    options?: { path?: string },
  ): ValidationIssue[];
  validatePresentationPhase(
    lesson: APALesson,
    phase: PresentationPhase,
    options?: { path?: string },
  ): ValidationIssue[];
  validateAssimilationPhase(
    lesson: APALesson,
    phase: AssimilationPhase,
    options?: { path?: string },
  ): ValidationIssue[];
  validateActiveRecallPhase(
    lesson: APALesson,
    phase: ActiveRecallPhase,
    options?: { path?: string },
  ): ValidationIssue[];
  validateFeedbackNextPhase(
    lesson: APALesson,
    phase: FeedbackNextPhase,
    options?: { path?: string },
  ): ValidationIssue[];
}

const defaultPhasePath = (phaseType: APAPhaseType): string => `lesson.phases.${phaseType}`;

export function createAPALessonValidationService(): APALessonValidationService {
  return {
    validateLesson: (lesson) => validateAPALesson(lesson),
    validateObjective: (objective) => validateLinguisticObjective(objective),
    validatePhaseBase: (lesson, phase, options) => {
      const path = options?.path ?? defaultPhasePath(phase.type);
      return validatePhaseBaseDetails(lesson, phase, path);
    },
    validatePresentationPhase: (lesson, phase, options) => {
      const path = options?.path ?? defaultPhasePath(phase.type);
      return [
        ...validatePhaseBaseDetails(lesson, phase, path),
        ...validatePresentationPhaseDetails(phase, path),
      ];
    },
    validateAssimilationPhase: (lesson, phase, options) => {
      const path = options?.path ?? defaultPhasePath(phase.type);
      return [
        ...validatePhaseBaseDetails(lesson, phase, path),
        ...validateAssimilationPhaseDetails(phase, path),
      ];
    },
    validateActiveRecallPhase: (lesson, phase, options) => {
      const path = options?.path ?? defaultPhasePath(phase.type);
      return [
        ...validatePhaseBaseDetails(lesson, phase, path),
        ...validateActiveRecallPhaseDetails(phase, path),
      ];
    },
    validateFeedbackNextPhase: (lesson, phase, options) => {
      const path = options?.path ?? defaultPhasePath(phase.type);
      return [
        ...validatePhaseBaseDetails(lesson, phase, path),
        ...validateFeedbackNextPhaseDetails(phase, path),
      ];
    },
  };
}

export const apaLessonValidationService = createAPALessonValidationService();
