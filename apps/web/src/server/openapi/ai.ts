import { z } from "zod";

import { registry } from "./registry";
import { ErrorResponseSchema } from "./schemas";

const TonePreferenceSchema = z
  .enum(["formal", "neutral", "casual"])
  .describe("Preferred tone for AI generated content.");

const LearnerProfileSchema = registry.register(
  "AiLearnerProfile",
  z.object({
    level: z.string().min(1).describe("Current proficiency level (e.g., CEFR or internal scale)."),
    goals: z.array(z.string().min(1)).min(1).describe("Learning goals the plan should address."),
    nativeLanguage: z
      .string()
      .min(2)
      .max(50)
      .optional()
      .describe("Learner's first language, used for additional context."),
    constraints: z
      .array(z.string().min(1))
      .optional()
      .describe("Known constraints like time, resources or accessibility needs."),
    availableHoursPerWeek: z
      .number()
      .int()
      .min(1)
      .max(168)
      .optional()
      .describe("Estimated time the learner can dedicate weekly."),
  }),
);

const PlanPreferencesSchema = registry.register(
  "AiPlanPreferences",
  z
    .object({
      tone: TonePreferenceSchema.optional(),
      focusAreas: z
        .array(z.string().min(1))
        .optional()
        .describe("Specific skills or topics the learner wants to emphasise."),
      contentTypes: z
        .array(z.string().min(1))
        .optional()
        .describe("Preferred lesson formats (e.g., video, reading, exercises)."),
    })
    .partial()
    .describe("Optional customisation values for the generated plan."),
);

const GeneratePlanRequestSchema = registry.register(
  "AiGeneratePlanRequest",
  z.object({
    learner: LearnerProfileSchema,
    timeframeWeeks: z
      .number()
      .int()
      .min(1)
      .describe("Time horizon, in weeks, that the study plan should cover."),
    priorKnowledge: z
      .string()
      .min(1)
      .optional()
      .describe("Relevant experience or background the learner already has."),
    preferences: PlanPreferencesSchema.optional(),
    locale: z
      .string()
      .min(2)
      .max(10)
      .optional()
      .describe("Locale hint (BCP 47) to tailor tone and examples."),
  }),
);

const LessonActivitySchema = registry.register(
  "AiLessonActivity",
  z.object({
    type: z.string().min(1).describe("Activity type identifier (e.g., warmup, drill, reflection)."),
    description: z.string().min(1).describe("What the learner should do in the activity."),
    durationMinutes: z
      .number()
      .int()
      .nonnegative()
      .describe("Estimated duration for the activity."),
    resources: z
      .array(z.string().min(1))
      .optional()
      .describe("Optional list of supporting resources or links."),
  }),
);

const LessonPlanSchema = registry.register(
  "AiLessonPlan",
  z.object({
    id: z.string().min(1).describe("Stable identifier for the lesson."),
    title: z.string().min(1).describe("Lesson title shown to the learner."),
    objective: z.string().min(1).describe("Main learning objective addressed by the lesson."),
    summary: z.string().min(1).describe("Short summary of what will be covered."),
    activities: z
      .array(LessonActivitySchema)
      .min(1)
      .describe("Activities that compose the lesson."),
    homework: z.string().min(1).optional().describe("Optional homework or reinforcement activity."),
  }),
);

const WeeklyFocusSchema = registry.register(
  "AiWeeklyFocus",
  z.object({
    week: z.number().int().min(1).describe("Week number within the generated plan."),
    theme: z.string().min(1).describe("Weekly theme that ties the lessons together."),
    objectives: z
      .array(z.string().min(1))
      .min(1)
      .describe("Objectives to achieve during the week."),
    lessons: z.array(LessonPlanSchema).min(1).describe("Lessons planned for the week."),
  }),
);

const GeneratePlanResponseSchema = registry.register(
  "AiGeneratePlanResponse",
  z.object({
    overview: z.string().min(1).describe("High-level description of the personalised plan."),
    rationale: z.string().min(1).describe("Explanation of why the plan fits the learner."),
    metrics: z
      .object({
        totalMinutes: z
          .number()
          .nonnegative()
          .describe("Total estimated effort required to complete the plan."),
        estimatedCompletionWeeks: z
          .number()
          .min(1)
          .describe("Estimated number of weeks to complete the plan."),
      })
      .describe("Plan metrics for progress tracking."),
    weeks: z.array(WeeklyFocusSchema).min(1).describe("Detailed structure broken down by week."),
    recommendations: z
      .array(z.string().min(1))
      .optional()
      .describe("Additional recommendations or next steps suggested by the AI."),
  }),
);

registry.registerPath({
  method: "post",
  path: "/api/ai/plan",
  summary: "Generate study plan",
  description:
    "Generates a personalised APA study plan based on the learner profile and objectives.",
  tags: ["AI"],
  operationId: "postAiPlan",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: GeneratePlanRequestSchema,
          examples: {
            default: {
              summary: "Brazilian developer preparing for senior interviews.",
              value: {
                learner: {
                  level: "B1",
                  goals: ["Move to B2", "Improve fluency for interviews"],
                  nativeLanguage: "pt-BR",
                  constraints: ["Only evenings", "Prefers short sessions"],
                  availableHoursPerWeek: 6,
                },
                timeframeWeeks: 6,
                preferences: {
                  tone: "neutral",
                  focusAreas: ["Interview practice", "Vocabulary"],
                },
                priorKnowledge: "4 years experience working with international teams.",
                locale: "pt-BR",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Plan generated successfully.",
      content: {
        "application/json": {
          schema: GeneratePlanResponseSchema,
          examples: {
            success: {
              summary: "Study plan sample with weekly focus and activities.",
              value: {
                overview: "A focused interview preparation plan covering fluency and technique.",
                rationale:
                  "Tailored to evening availability with emphasis on conversational practice.",
                metrics: {
                  totalMinutes: 540,
                  estimatedCompletionWeeks: 6,
                },
                weeks: [
                  {
                    week: 1,
                    theme: "Diagnóstico e objetivos",
                    objectives: [
                      "Avaliar fluência em entrevistas",
                      "Refinar respostas do tipo tell me about yourself",
                    ],
                    lessons: [
                      {
                        id: "week1-lesson1",
                        title: "Mapeando histórias STAR",
                        objective: "Estruturar narrativas usando STAR.",
                        summary:
                          "Identifique conquistas recentes e pratique traduzir para inglês claro.",
                        activities: [
                          {
                            type: "reflection",
                            description: "Liste 3 histórias de projeto recentes com impacto.",
                            durationMinutes: 20,
                          },
                          {
                            type: "practice",
                            description:
                              "Grave respostas em inglês e revise pontos fortes vs pontos fracos.",
                            durationMinutes: 25,
                            resources: ["https://example.com/star-template"],
                          },
                        ],
                        homework:
                          "Compartilhe uma resposta STAR com um colega para feedback adicional.",
                      },
                    ],
                  },
                ],
                recommendations: [
                  "Envie respostas para feedback semanal do Teacher AI.",
                  "Reserve 30 minutos semanais para entrevistas simuladas.",
                ],
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid payload provided.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    503: {
      description: "AI services are currently unavailable.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const EvaluationCriterionSchema = registry.register(
  "AiEvaluationCriterion",
  z.object({
    id: z.string().min(1).describe("Identifier for the evaluation criterion."),
    description: z.string().min(1).describe("What the criterion evaluates."),
    weight: z
      .number()
      .nonnegative()
      .optional()
      .describe("Optional weight applied to the criterion."),
    rubric: z
      .string()
      .min(1)
      .optional()
      .describe("Detailed rubric or expectations for this criterion."),
  }),
);

const EvaluateAnswerInputSchema = registry.register(
  "AiEvaluateAnswerInput",
  z.object({
    question: z.string().min(1).describe("Prompt or question answered by the learner."),
    answer: z.string().min(1).describe("Learner's answer that should be evaluated."),
    expectedAnswer: z
      .string()
      .min(1)
      .optional()
      .describe("Ideal answer used as reference when available."),
    evaluationCriteria: z
      .array(EvaluationCriterionSchema)
      .min(1)
      .describe("Criteria used to grade the learner's answer."),
    locale: z
      .string()
      .min(2)
      .max(10)
      .optional()
      .describe("Locale hint to adjust scoring and feedback."),
  }),
);

const EvaluateAnswerResultSchema = registry.register(
  "AiEvaluateAnswerResult",
  z.object({
    overallScore: z.number().describe("Aggregate score provided by the AI."),
    grade: z.string().min(1).optional().describe("Optional grade label (e.g., A, B, C)."),
    strengths: z
      .array(z.string().min(1))
      .min(1)
      .describe("Positive aspects highlighted in the answer."),
    improvements: z.array(z.string().min(1)).min(1).describe("Areas that need improvement."),
    issues: z
      .array(
        z.object({
          type: z.string().min(1).describe("Category of the detected issue."),
          message: z.string().min(1).describe("Human readable explanation of the issue."),
          suggestion: z
            .string()
            .min(1)
            .optional()
            .describe("Optional suggestion to fix the problem."),
        }),
      )
      .describe("Detailed issues detected in the answer."),
  }),
);

const RubricCriterionSchema = registry.register(
  "AiRubricCriterion",
  z.object({
    id: z.string().min(1).describe("Identifier of the rubric criterion."),
    title: z.string().min(1).describe("Readable title of the criterion."),
    description: z.string().min(1).describe("Description of what the criterion evaluates."),
    weight: z.number().nonnegative().optional().describe("Optional weight for this rubric item."),
    expectations: z.string().min(1).optional().describe("Detailed expectations or sample answers."),
  }),
);

const InterviewRubricInputSchema = registry.register(
  "AiInterviewRubricInput",
  z.object({
    transcript: z.string().min(1).describe("Transcript of the interview answer to evaluate."),
    rubric: z
      .array(RubricCriterionSchema)
      .min(1)
      .describe("Rubric items used to assess the answer."),
    context: z
      .object({
        position: z.string().min(1).optional().describe("Role or position for the interview."),
        seniority: z.string().min(1).optional().describe("Candidate seniority used for grading."),
        locale: z.string().min(2).max(10).optional().describe("Locale hint for the evaluation."),
      })
      .partial()
      .optional()
      .describe("Optional context to guide the evaluation."),
  }),
);

const RubricCriterionEvaluationSchema = registry.register(
  "AiRubricCriterionEvaluation",
  z.object({
    criterionId: z.string().min(1).describe("Identifier of the evaluated rubric criterion."),
    score: z.number().describe("Score assigned to the criterion."),
    evidence: z.string().min(1).describe("Evidence supporting the score."),
    notes: z.string().min(1).optional().describe("Optional additional notes or observations."),
    actionItems: z
      .array(z.string().min(1))
      .optional()
      .describe("Optional actionable items to improve performance."),
  }),
);

const InterviewRubricResultSchema = registry.register(
  "AiInterviewRubricResult",
  z.object({
    overallScore: z.number().describe("Aggregate score across the rubric criteria."),
    summary: z.string().min(1).describe("High-level summary of the evaluation."),
    criteria: z
      .array(RubricCriterionEvaluationSchema)
      .min(1)
      .describe("Per criterion scoring and feedback."),
  }),
);

const AssessmentRequestSchema = registry.register(
  "AiAssessmentRequest",
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("answer"),
      input: EvaluateAnswerInputSchema.describe("Input used to evaluate a single textual answer."),
    }),
    z.object({
      type: z.literal("interview"),
      input: InterviewRubricInputSchema.describe(
        "Input used to evaluate an interview answer with rubric.",
      ),
    }),
  ]),
);

const AssessmentResponseSchema = registry.register(
  "AiAssessmentResponse",
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("answer"),
      result: EvaluateAnswerResultSchema.describe("Evaluation returned for the learner answer."),
    }),
    z.object({
      type: z.literal("interview"),
      result: InterviewRubricResultSchema.describe(
        "Evaluation returned for the rubric assessment.",
      ),
    }),
  ]),
);

registry.registerPath({
  method: "post",
  path: "/api/ai/assessment",
  summary: "Evaluate learner performance",
  description:
    "Evaluates learner answers or interview transcripts using AI generated feedback and scoring.",
  tags: ["AI"],
  operationId: "postAiAssessment",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: AssessmentRequestSchema,
          examples: {
            answer: {
              summary: "Evaluate a written answer using configured criteria.",
              value: {
                type: "answer",
                input: {
                  question: "Explain the concept of microservices in your own words.",
                  answer:
                    "Microservices are small services that can be deployed independently. They communicate via APIs and allow teams to scale parts of the system independently.",
                  evaluationCriteria: [
                    { id: "clarity", description: "Clarity and structure of the explanation." },
                    { id: "accuracy", description: "Technical accuracy of the content." },
                  ],
                  locale: "en-US",
                },
              },
            },
            interview: {
              summary: "Evaluate an interview transcript against a rubric.",
              value: {
                type: "interview",
                input: {
                  transcript:
                    "I led a migration to microservices by planning the rollout, coaching the team and monitoring performance after launch.",
                  rubric: [
                    {
                      id: "communication",
                      title: "Communication",
                      description: "Clarity and confidence when answering.",
                    },
                    {
                      id: "impact",
                      title: "Impact",
                      description: "Ability to demonstrate measurable outcomes.",
                    },
                  ],
                  context: {
                    position: "Senior Backend Engineer",
                    locale: "en-US",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Assessment completed successfully.",
      content: {
        "application/json": {
          schema: AssessmentResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request payload.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    503: {
      description: "AI services temporarily unavailable.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const ChatRoleSchema = z
  .enum(["system", "user", "assistant", "tool"])
  .describe("Role associated with the chat message.");

const ChatMessageSchema = registry.register(
  "AiChatMessage",
  z.object({
    role: ChatRoleSchema,
    content: z.string().min(1).describe("Message content supplied to the AI model."),
    name: z.string().min(1).optional().describe("Optional name identifying the participant."),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Optional metadata forwarded to the AI provider."),
  }),
);

const ChatRequestSchema = registry.register(
  "AiChatRequest",
  z.object({
    messages: z
      .array(ChatMessageSchema)
      .min(1)
      .describe("Conversation history that should be considered for the reply."),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .optional()
      .describe("Sampling temperature for the chat completion."),
    maxTokens: z.number().int().min(1).optional().describe("Upper bound for generated tokens."),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Additional metadata sent alongside the request."),
  }),
);

const TokenUsageSchema = registry.register(
  "AiTokenUsage",
  z.object({
    promptTokens: z.number().int().nonnegative().describe("Prompt tokens consumed."),
    completionTokens: z.number().int().nonnegative().describe("Completion tokens consumed."),
    totalTokens: z.number().int().nonnegative().describe("Total tokens consumed."),
  }),
);

const ChatReplySchema = registry.register(
  "AiChatReply",
  z.object({
    message: ChatMessageSchema.describe("Assistant reply generated by the AI provider."),
    usage: TokenUsageSchema.optional().describe("Token usage returned by the provider."),
  }),
);

registry.registerPath({
  method: "post",
  path: "/api/ai/chat",
  summary: "Get chat reply",
  description: "Generates a conversational reply from the Teacher AI assistant.",
  tags: ["AI"],
  operationId: "postAiChat",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ChatRequestSchema,
          examples: {
            default: {
              summary: "Continue a conversation with the Teacher AI assistant.",
              value: {
                messages: [
                  {
                    role: "system",
                    content:
                      "You are Teacher AI, an encouraging English tutor focused on interview preparation.",
                  },
                  {
                    role: "user",
                    content: "How can I improve my answer about solving performance issues?",
                  },
                ],
                temperature: 0.7,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Chat reply generated successfully.",
      content: {
        "application/json": {
          schema: ChatReplySchema,
          examples: {
            success: {
              summary: "Sample AI assistant reply.",
              value: {
                message: {
                  role: "assistant",
                  content:
                    "Consider adding impact: explain how you measured the performance gain and what metrics improved.",
                },
                usage: {
                  promptTokens: 120,
                  completionTokens: 45,
                  totalTokens: 165,
                },
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid chat payload.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    503: {
      description: "AI chat provider unavailable.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
