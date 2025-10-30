import type {
  ActiveRecallPhase,
  APALesson,
  APAPhaseBase,
  AssimilationPhase,
  FeedbackNextPhase,
  PresentationPhase,
} from "../entities";
import {
  APA_PHASE_ORDER,
  type APAPhaseType,
  CEFR_LEVELS,
  FEEDBACK_ACTORS,
  FEEDBACK_CHANNELS,
  LINGUISTIC_SKILLS,
  type LinguisticObjective,
  NEXT_STEP_FOCUS_OPTIONS,
  OBJECTIVE_FOCUS_OPTIONS,
  type ObjectiveFocus,
  PRACTICE_MODES,
  PRESENTATION_MATERIAL_TYPES,
  RESOURCE_TYPES,
  RETRIEVAL_PROMPT_FORMATS,
  SUPPORT_LEVELS,
} from "../value-objects";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  path: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function getValidationStatus(issues: ValidationIssue[]): ValidationResult {
  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

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

  for (const missingPhase of missingPhases) {
    issues.push({
      path: `lesson.phases.${missingPhase}`,
      message: `Phase "${missingPhase}" is required in the APA flow.`,
      severity: "error",
    });
  }

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

    issues.push(...validatePhaseBase(lesson, phase, phaseType));

    if (!phase.objectiveLinks.some((link) => link.objectiveId === lesson.objective.id)) {
      issues.push({
        path: `lesson.phases.${phaseType}.objectiveLinks`,
        message: "At least one objective link must target the lesson objective.",
        severity: "error",
      });
    }

    switch (phaseType) {
      case "presentation":
        issues.push(...validatePresentationPhase(phase as PresentationPhase, phaseType));
        break;
      case "assimilation":
        issues.push(...validateAssimilationPhase(phase as AssimilationPhase, phaseType));
        break;
      case "activeRecall":
        issues.push(...validateActiveRecallPhase(phase as ActiveRecallPhase, phaseType));
        break;
      case "feedbackNext":
        issues.push(...validateFeedbackNextPhase(phase as FeedbackNextPhase, phaseType));
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

function validatePhaseBase(
  lesson: APALesson,
  phase: APAPhaseBase,
  phaseType: APAPhaseType,
): ValidationIssue[] {
  const path = `lesson.phases.${phaseType}`;
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
  focusAreas: LinguisticObjective["focusAreas"],
  focus: ObjectiveFocus,
): boolean {
  return focusAreas.some((area) => area.focus === focus);
}

function validatePresentationPhase(
  phase: PresentationPhase,
  phaseType: "presentation",
): ValidationIssue[] {
  const path = `lesson.phases.${phaseType}`;
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

function validateAssimilationPhase(
  phase: AssimilationPhase,
  phaseType: "assimilation",
): ValidationIssue[] {
  const path = `lesson.phases.${phaseType}`;
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

function validateActiveRecallPhase(
  phase: ActiveRecallPhase,
  phaseType: "activeRecall",
): ValidationIssue[] {
  const path = `lesson.phases.${phaseType}`;
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

function validateFeedbackNextPhase(
  phase: FeedbackNextPhase,
  phaseType: "feedbackNext",
): ValidationIssue[] {
  const path = `lesson.phases.${phaseType}`;
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
