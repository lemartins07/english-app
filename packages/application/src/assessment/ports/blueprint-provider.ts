import type {
  AssessmentCriterion,
  AssessmentQuestion,
  AssessmentSkill,
  CEFRLevel,
} from "@english-app/domain";

export interface AssessmentBlueprint {
  id: string;
  title?: string;
  targetLevel?: CEFRLevel;
  skillsCovered: AssessmentSkill[];
  questions: AssessmentQuestion[];
  criteria: AssessmentCriterion[];
}

export interface AssessmentBlueprintProvider {
  getById(blueprintId: string): Promise<AssessmentBlueprint | null>;
}
