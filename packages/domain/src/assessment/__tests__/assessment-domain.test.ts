import { assert } from "vitest";
import { test } from "vitest";

import {
  calculateSessionProgress,
  canRecordResponse,
  createAssessmentCriterion,
  createAssessmentDiagnostic,
  createAssessmentSession,
  createCEFRDiagnosticProfile,
  createListeningQuestion,
  createMultipleChoiceQuestion,
  createSpeakingQuestion,
  pendingQuestionIds,
  toAssessmentQuestionDTO,
  toAssessmentSessionDTO,
} from "../index";

test("createMultipleChoiceQuestion validates options and normalises weight", () => {
  const question = createMultipleChoiceQuestion({
    id: "mcq-1",
    title: "Verb tenses",
    skill: "grammar",
    cefrLevel: "B1",
    weight: 12.345,
    stem: "Select the correct verb form.",
    options: [
      { id: "a", label: "Option A", text: "He go to work every day." },
      { id: "b", label: "Option B", text: "He goes to work every day." },
      { id: "c", label: "Option C", text: "He going to work every day." },
    ],
    correctOptionIds: ["b"],
    tags: ["grammar", "Grammar", "verb"],
  });

  assert.equal(question.weight, 12.35);
  assert.deepEqual(question.tags, ["grammar", "verb"]);
  assert.equal(question.correctOptionIds.length, 1);
});

test("createMultipleChoiceQuestion throws when correct option is missing", () => {
  assert.throws(
    () =>
      createMultipleChoiceQuestion({
        id: "mcq-2",
        title: "Invalid question",
        skill: "reading",
        cefrLevel: "A2",
        weight: 10,
        stem: "Pick the correct statement.",
        options: [
          { id: "a", label: "Option A", text: "Statement A" },
          { id: "b", label: "Option B", text: "Statement B" },
        ],
        correctOptionIds: ["c"],
      }),
    /not present in the available options/,
  );
});

test("createAssessmentCriterion validates descriptors and weight", () => {
  const criterion = createAssessmentCriterion({
    id: "crit-1",
    title: "Fluency",
    skill: "speaking",
    focus: "Delivery and flow",
    weight: 25,
    descriptors: [
      {
        level: "needsSupport",
        minScore: 0,
        maxScore: 24,
        descriptor: "Frequent pauses and hesitations impact comprehension.",
        evidenceExamples: ["Long pauses", "Broken sentences"],
      },
      {
        level: "emerging",
        minScore: 25,
        maxScore: 49,
        descriptor: "Some hesitations but ideas are mostly clear.",
        evidenceExamples: ["Occasional reformulation"],
      },
      {
        level: "proficient",
        minScore: 50,
        maxScore: 79,
        descriptor: "Smooth delivery with minor pauses for planning.",
        evidenceExamples: ["Natural self-correction"],
      },
      {
        level: "advanced",
        minScore: 80,
        maxScore: 100,
        descriptor: "Effortless delivery with natural rhythm and intonation.",
        evidenceExamples: ["Intonation reinforces meaning"],
      },
    ],
  });

  assert.equal(criterion.weight, 25);
  assert.equal(criterion.descriptors[0].level, "needsSupport");
  assert.equal(criterion.descriptors.at(-1)?.level, "advanced");
});

test("createCEFRDiagnosticProfile infers band and trims rationale", () => {
  const profile = createCEFRDiagnosticProfile({
    score: 78.4,
    rationale: ["  Solid lexical range  ", "  "],
  });

  assert.equal(profile.level, "C1");
  assert.equal(profile.score, 78);
  assert.deepEqual(profile.rationale, ["Solid lexical range"]);
});

test("createAssessmentDiagnostic requires unique skills", () => {
  const diagnostic = createAssessmentDiagnostic({
    score: 62,
    skills: [
      {
        skill: "listening",
        score: 66,
        strengths: ["Understands key details"],
        improvements: ["Work on idioms"],
      },
      {
        skill: "speaking",
        score: 58,
        strengths: ["Good structure"],
        improvements: ["Improve pacing"],
      },
    ],
    recommendations: ["Prioritise fluency drills"],
  });

  assert.equal(diagnostic.skills.length, 2);

  assert.throws(
    () =>
      createAssessmentDiagnostic({
        score: 60,
        skills: [
          { skill: "reading", score: 55 },
          { skill: "reading", score: 70 },
        ],
      }),
    /unique skills/,
  );
});

test("createAssessmentSession sanitises responses and exposes DTOs without answers", () => {
  const multipleChoice = createMultipleChoiceQuestion({
    id: "mcq-1",
    title: "Grammar check",
    skill: "grammar",
    cefrLevel: "B1",
    weight: 20,
    stem: "Choose the correct verb form.",
    options: [
      { id: "a", label: "Option A", text: "She work in tech." },
      { id: "b", label: "Option B", text: "She works in tech." },
    ],
    correctOptionIds: ["b"],
  });

  const listening = createListeningQuestion({
    id: "lst-1",
    title: "Daily stand-up",
    skill: "listening",
    cefrLevel: "B1",
    weight: 30,
    prompt: "After listening to the audio, choose the best summary.",
    stimulus: { audioUrl: "https://cdn.example.com/standup.mp3" },
    options: [
      { id: "a", label: "Option A", text: "Discussed blockers and tasks." },
      { id: "b", label: "Option B", text: "Planning a vacation." },
    ],
    correctOptionIds: ["a"],
  });

  const speaking = createSpeakingQuestion({
    id: "spk-1",
    title: "Elevator pitch",
    skill: "speaking",
    cefrLevel: "B2",
    weight: 50,
    prompt: {
      context: "You are meeting a tech recruiter at a conference.",
      instruction: "Deliver a 60 second elevator pitch covering background and key skills.",
      hints: ["Highlight achievements", "Mention tech stack"],
    },
    rubricCriterionIds: ["crit-1"],
    expectedDurationSeconds: 90,
  });

  const session = createAssessmentSession({
    id: "sess-1",
    userId: "user-1",
    blueprintId: "blueprint-1",
    questions: [multipleChoice, listening, speaking],
    responses: [
      {
        type: "multipleChoice",
        questionId: "mcq-1",
        submittedAt: "2025-10-29T14:00:00.000Z",
        selectedOptionIds: ["b"],
        score: 100,
      },
    ],
    startedAt: "2025-10-29T13:59:00.000Z",
    createdAt: "2025-10-29T13:58:00.000Z",
    updatedAt: "2025-10-29T13:59:30.000Z",
  });

  assert.equal(calculateSessionProgress(session), 0.33);
  assert.deepEqual(pendingQuestionIds(session), ["lst-1", "spk-1"]);
  assert.equal(canRecordResponse(session, "lst-1"), true);

  const questionDTO = toAssessmentQuestionDTO(multipleChoice);
  assert.equal("correctOptionIds" in questionDTO, false);

  const sessionDTO = toAssessmentSessionDTO(session);
  assert.equal(sessionDTO.progress, 0.33);
  assert.equal(sessionDTO.questions.length, 3);
  assert.equal(sessionDTO.responses.length, 1);
});
