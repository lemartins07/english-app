export type AssessmentLifecycleEvent =
  | "assessment.started"
  | "assessment.response_recorded"
  | "assessment.completed"
  | "assessment.ia_degraded";

export interface RetentionEventEmitter {
  emit(event: AssessmentLifecycleEvent, payload?: Record<string, unknown>): void;
}
