import type { AssessmentDiagnostic, AssessmentResponse, AssessmentSession } from "../entities";
import { calculateSessionProgress } from "../entities";
import type { CEFRDiagnosticProfile } from "../value-objects/cefr";
import type { AssessmentCriterion, RubricDescriptor } from "../value-objects/criteria";
import type {
  AssessmentQuestion,
  AssessmentSkill,
  ListeningQuestion,
  MultipleChoiceOption,
  MultipleChoiceQuestion,
  SpeakingQuestion,
} from "../value-objects/questions";

export interface AssessmentQuestionDTOBase {
  id: string;
  title: string;
  type: AssessmentQuestion["type"];
  skill: AssessmentSkill;
  cefrLevel: AssessmentQuestion["cefrLevel"];
  weight: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface MultipleChoiceOptionDTO {
  id: string;
  label: string;
  text: string;
}

export interface MultipleChoiceQuestionDTO extends AssessmentQuestionDTOBase {
  type: "multipleChoice";
  stem: string;
  options: MultipleChoiceOptionDTO[];
  explanation?: string;
}

export interface ListeningQuestionDTO extends AssessmentQuestionDTOBase {
  type: "listening";
  prompt: string;
  stimulus: ListeningQuestion["stimulus"];
  options?: MultipleChoiceOptionDTO[];
  followUpPrompt?: string;
}

export interface SpeakingQuestionDTO extends AssessmentQuestionDTOBase {
  type: "speaking";
  prompt: SpeakingQuestion["prompt"];
  expectedDurationSeconds?: number;
  rubricCriterionIds: string[];
}

export type AssessmentQuestionDTO =
  | MultipleChoiceQuestionDTO
  | ListeningQuestionDTO
  | SpeakingQuestionDTO;

function toMultipleChoiceOptionDTO(option: MultipleChoiceOption): MultipleChoiceOptionDTO {
  return {
    id: option.id,
    label: option.label,
    text: option.text,
  };
}

function toMultipleChoiceQuestionDTO(question: MultipleChoiceQuestion): MultipleChoiceQuestionDTO {
  return {
    id: question.id,
    title: question.title,
    type: "multipleChoice",
    skill: question.skill,
    cefrLevel: question.cefrLevel,
    weight: question.weight,
    tags: question.tags,
    metadata: question.metadata,
    stem: question.stem,
    options: question.options.map(toMultipleChoiceOptionDTO),
    explanation: question.explanation,
  };
}

function toListeningQuestionDTO(question: ListeningQuestion): ListeningQuestionDTO {
  return {
    id: question.id,
    title: question.title,
    type: "listening",
    skill: question.skill,
    cefrLevel: question.cefrLevel,
    weight: question.weight,
    tags: question.tags,
    metadata: question.metadata,
    prompt: question.prompt,
    stimulus: question.stimulus,
    options: question.options?.map(toMultipleChoiceOptionDTO),
    followUpPrompt: question.followUpPrompt,
  };
}

function toSpeakingQuestionDTO(question: SpeakingQuestion): SpeakingQuestionDTO {
  return {
    id: question.id,
    title: question.title,
    type: "speaking",
    skill: question.skill,
    cefrLevel: question.cefrLevel,
    weight: question.weight,
    tags: question.tags,
    metadata: question.metadata,
    prompt: question.prompt,
    expectedDurationSeconds: question.expectedDurationSeconds,
    rubricCriterionIds: question.rubricCriterionIds,
  };
}

export function toAssessmentQuestionDTO(question: AssessmentQuestion): AssessmentQuestionDTO {
  switch (question.type) {
    case "multipleChoice":
      return toMultipleChoiceQuestionDTO(question);
    case "listening":
      return toListeningQuestionDTO(question);
    case "speaking":
      return toSpeakingQuestionDTO(question);
    default:
      return (() => {
        const exhaustiveCheck: never = question;
        return exhaustiveCheck;
      })();
  }
}

export type RubricDescriptorDTO = RubricDescriptor;

export interface AssessmentCriterionDTO {
  id: string;
  title: string;
  skill: AssessmentSkill;
  focus: string;
  weight: number;
  descriptors: RubricDescriptorDTO[];
}

export function toAssessmentCriterionDTO(criterion: AssessmentCriterion): AssessmentCriterionDTO {
  return {
    id: criterion.id,
    title: criterion.title,
    skill: criterion.skill,
    focus: criterion.focus,
    weight: criterion.weight,
    descriptors: criterion.descriptors.map((descriptor: RubricDescriptor) => ({
      ...descriptor,
    })),
  };
}

export interface CEFRDiagnosticProfileDTO {
  level: CEFRDiagnosticProfile["level"];
  score: CEFRDiagnosticProfile["score"];
  confidence: CEFRDiagnosticProfile["confidence"];
  label: CEFRDiagnosticProfile["band"]["label"];
  description: CEFRDiagnosticProfile["band"]["description"];
  rationale: string[];
}

export function toCEFRDiagnosticProfileDTO(
  profile: CEFRDiagnosticProfile,
): CEFRDiagnosticProfileDTO {
  return {
    level: profile.level,
    score: profile.score,
    confidence: profile.confidence,
    label: profile.band.label,
    description: profile.band.description,
    rationale: profile.rationale,
  };
}

export interface SkillDiagnosticDTO {
  skill: AssessmentSkill;
  profile: CEFRDiagnosticProfileDTO;
  percentile?: number;
  strengths: string[];
  improvements: string[];
}

export interface AssessmentDiagnosticDTO {
  overall: CEFRDiagnosticProfileDTO;
  skills: SkillDiagnosticDTO[];
  recommendations: string[];
  notes?: string;
}

export function toAssessmentDiagnosticDTO(
  diagnostic: AssessmentDiagnostic,
): AssessmentDiagnosticDTO {
  return {
    overall: toCEFRDiagnosticProfileDTO(diagnostic.overall),
    skills: diagnostic.skills.map((skill) => ({
      skill: skill.skill,
      profile: toCEFRDiagnosticProfileDTO(skill.profile),
      percentile: skill.percentile,
      strengths: skill.strengths,
      improvements: skill.improvements,
    })),
    recommendations: diagnostic.recommendations,
    notes: diagnostic.notes,
  };
}

export interface AssessmentResponseDTOBase {
  questionId: string;
  type: AssessmentResponse["type"];
  submittedAt: AssessmentResponse["submittedAt"];
  score?: number;
}

export interface MultipleChoiceResponseDTO extends AssessmentResponseDTOBase {
  type: "multipleChoice";
  selectedOptionIds: string[];
  confidence?: number;
}

export interface ListeningResponseDTO extends AssessmentResponseDTOBase {
  type: "listening";
  selectedOptionIds?: string[];
  notes?: string;
  confidence?: number;
}

export interface SpeakingResponseDTO extends AssessmentResponseDTOBase {
  type: "speaking";
  transcript: string;
  audioUrl?: string;
  rubricScores?: Record<string, number>;
}

export type AssessmentResponseDTO =
  | MultipleChoiceResponseDTO
  | ListeningResponseDTO
  | SpeakingResponseDTO;

export function toAssessmentResponseDTO(response: AssessmentResponse): AssessmentResponseDTO {
  switch (response.type) {
    case "multipleChoice":
      return {
        questionId: response.questionId,
        type: "multipleChoice",
        submittedAt: response.submittedAt,
        selectedOptionIds: response.selectedOptionIds,
        confidence: response.confidence,
        score: response.score,
      };
    case "listening":
      return {
        questionId: response.questionId,
        type: "listening",
        submittedAt: response.submittedAt,
        selectedOptionIds: response.selectedOptionIds,
        notes: response.notes,
        confidence: response.confidence,
        score: response.score,
      };
    case "speaking":
      return {
        questionId: response.questionId,
        type: "speaking",
        submittedAt: response.submittedAt,
        transcript: response.transcript,
        audioUrl: response.audioUrl,
        rubricScores: response.rubricScores,
        score: response.score,
      };
    default:
      return (() => {
        const exhaustiveCheck: never = response;
        return exhaustiveCheck;
      })();
  }
}

export interface AssessmentSessionDTO {
  id: AssessmentSession["id"];
  userId: AssessmentSession["userId"];
  blueprintId: AssessmentSession["blueprintId"];
  status: AssessmentSession["status"];
  targetLevel?: AssessmentSession["targetLevel"];
  progress: number;
  questions: AssessmentQuestionDTO[];
  responses: AssessmentResponseDTO[];
  diagnostic?: AssessmentDiagnosticDTO;
  startedAt: AssessmentSession["startedAt"];
  completedAt?: AssessmentSession["completedAt"];
}

export function toAssessmentSessionDTO(session: AssessmentSession): AssessmentSessionDTO {
  return {
    id: session.id,
    userId: session.userId,
    blueprintId: session.blueprintId,
    status: session.status,
    targetLevel: session.targetLevel,
    progress: calculateSessionProgress(session),
    questions: session.questions.map(toAssessmentQuestionDTO),
    responses: session.responses.map(toAssessmentResponseDTO),
    diagnostic: session.diagnostic ? toAssessmentDiagnosticDTO(session.diagnostic) : undefined,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
  };
}
