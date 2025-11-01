import type { AssessmentBlueprint, AssessmentBlueprintProvider } from "@english-app/application";
import {
  createAssessmentCriterion,
  createListeningQuestion,
  createMultipleChoiceQuestion,
  createSpeakingQuestion,
} from "@english-app/domain";

function createTestBlueprint(): AssessmentBlueprint {
  const rubric = createAssessmentCriterion({
    id: "crit-fluency",
    title: "Fluency",
    skill: "speaking",
    focus: "Maintain flow during interviews",
    weight: 33,
    descriptors: [
      {
        level: "needsSupport",
        minScore: 0,
        maxScore: 25,
        descriptor: "Frequent pauses",
        evidenceExamples: [],
      },
      {
        level: "emerging",
        minScore: 26,
        maxScore: 50,
        descriptor: "Some hesitations",
        evidenceExamples: [],
      },
      {
        level: "proficient",
        minScore: 51,
        maxScore: 75,
        descriptor: "Generally smooth",
        evidenceExamples: [],
      },
      {
        level: "advanced",
        minScore: 76,
        maxScore: 100,
        descriptor: "Natural delivery",
        evidenceExamples: [],
      },
    ],
  });

  const grammar = createMultipleChoiceQuestion({
    id: "grammar-1",
    title: "Verb agreement",
    skill: "grammar",
    cefrLevel: "B1",
    weight: 35,
    stem: "Choose the correct sentence",
    options: [
      { id: "a", label: "Option A", text: "She go to work" },
      { id: "b", label: "Option B", text: "She goes to work" },
    ],
    correctOptionIds: ["b"],
  });

  const listening = createListeningQuestion({
    id: "listening-1",
    title: "Daily standup",
    skill: "listening",
    cefrLevel: "B1",
    weight: 25,
    prompt: "What is the best summary?",
    stimulus: { audioUrl: "https://cdn.local/audio.mp3" },
    options: [
      { id: "a", label: "Option A", text: "Team reviewing blockers" },
      { id: "b", label: "Option B", text: "Planning a vacation" },
    ],
    correctOptionIds: ["a"],
  });

  const speaking = createSpeakingQuestion({
    id: "speaking-1",
    title: "STAR story",
    skill: "speaking",
    cefrLevel: "B2",
    weight: 40,
    rubricCriterionIds: [rubric.id],
    prompt: {
      context: "Describe a production incident",
      instruction: "Share what happened and outcome",
      hints: ["Mention metrics", "Results"],
    },
    expectedDurationSeconds: 90,
  });

  return {
    id: "bp-leveling",
    title: "Leveling v1",
    targetLevel: "B2",
    skillsCovered: ["grammar", "listening", "speaking"],
    questions: [grammar, listening, speaking],
    criteria: [rubric],
  };
}

class StaticBlueprintProvider implements AssessmentBlueprintProvider {
  constructor(private readonly blueprint: AssessmentBlueprint) {}

  async getById(blueprintId: string): Promise<AssessmentBlueprint | null> {
    return blueprintId === this.blueprint.id ? this.blueprint : null;
  }
}

export const blueprintProvider = new StaticBlueprintProvider(createTestBlueprint());
