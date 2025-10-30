import type { APAPhase, APAPhases } from "../entities";
import { APA_PHASE_ORDER } from "../value-objects";

export function getOrderedPhases(phases: APAPhases): APAPhase[] {
  return APA_PHASE_ORDER.map((phaseType) => phases[phaseType]);
}
