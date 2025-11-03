import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOpenAiLLMClient } from "./openai";

type CreateChatCompletionMock = (
  params: ChatCompletionCreateParamsNonStreaming,
  options: { signal?: AbortSignal },
) => Promise<unknown>;

const createChatCompletionMock = vi.fn<CreateChatCompletionMock>();

vi.mock("openai", () => {
  class OpenAI {
    chat = {
      completions: {
        create: createChatCompletionMock,
      },
    };

    constructor() {}

    static APIError = class APIError extends Error {
      status?: number;
      type?: string;
      code?: string | number;
      headers?: {
        get: (name: string) => string | null | undefined;
      };

      constructor(message?: string, init?: Partial<APIError>) {
        super(message ?? "APIError");
        Object.assign(this, init);
      }
    };
  }

  return {
    __esModule: true,
    default: OpenAI,
  };
});

describe("createOpenAiLLMClient", () => {
  beforeEach(() => {
    createChatCompletionMock.mockReset();
  });

  it("transforms structured rubric assessment responses into the expected domain format", async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              {
                type: "output_json",
                json: {
                  candidate: {
                    name: "Leandro",
                    notes: "Transcript provided for a test.",
                  },
                  rubricAssessment: [
                    {
                      id: "crit-fluency",
                      title: "Fluency",
                      weight: 33,
                      score: 70,
                      level: "PROFICIENT",
                      levelDescriptor: "Generally smooth (51-75)",
                      evidence: [
                        "The sample consists of a single sentence with no obvious hesitations.",
                        "Two clauses linked with commas; suggests natural delivery.",
                      ],
                      improvementSuggestions: [
                        "Capture longer passages to evaluate sustainment of fluency across multiple sentences.",
                        "Practice speaking at a consistent pace; employ brief deliberate pauses for emphasis.",
                        "Record and listen to identify any minor pauses or filler words not apparent in this transcript.",
                      ],
                    },
                  ],
                  overall: {
                    rawScore: 70,
                    weightedScore: 23.1,
                    outOf: 100,
                  },
                },
              },
            ],
          },
        },
      ],
    });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    const result = await client.interviewRubricEval({
      transcript: "Candidate explained their project experience.",
      rubric: [
        {
          id: "communication",
          title: "Communication",
          description: "Evaluate clarity and structure.",
        },
      ],
    });

    expect(result).toEqual({
      overallScore: 23.1,
      summary:
        "Candidate Leandro. Overall score 23.1 / 100. Levels: Fluency: PROFICIENT. Transcript provided for a test.",
      criteria: [
        {
          criterionId: "crit-fluency",
          score: 70,
          evidence:
            "The sample consists of a single sentence with no obvious hesitations.\nTwo clauses linked with commas; suggests natural delivery.",
          notes: "Generally smooth (51-75) | Fluency: PROFICIENT | Weight: 33",
          actionItems: [
            "Capture longer passages to evaluate sustainment of fluency across multiple sentences.",
            "Practice speaking at a consistent pace; employ brief deliberate pauses for emphasis.",
            "Record and listen to identify any minor pauses or filler words not apparent in this transcript.",
          ],
        },
      ],
    });
  });

  it("transforms single-criterion coaching responses into the expected domain format", async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              {
                type: "output_json",
                json: {
                  criterion: {
                    id: "crit-fluency",
                    name: "Fluency",
                    weight: 33,
                    max_score: 100,
                    score: 42,
                    rating: "EMERGING",
                    rating_description:
                      "Some hesitations; noticeable filler words; occasional run-on phrases",
                  },
                  evidence: {
                    observations: [
                      "Introduction and role are stated clearly.",
                      "There are filler words and hesitations.",
                    ],
                    transcript_excerpt: ["I want to be, I want to gain more money."],
                  },
                  strengths: [
                    "Clear identification of name and current role",
                    "Direct articulation of motivation tied to the role",
                  ],
                  areas_for_improvement: [
                    "Reduce filler words.",
                    "Break complex ideas into shorter sentences.",
                  ],
                  actionable_recommendations: [
                    "Record a 2-minute practice version and review for filler words.",
                  ],
                  example_improved_response: {
                    improved_version:
                      "Hi, I'm Leandro. I'm a software developer currently working at a bank.",
                  },
                  next_steps: ["Schedule mock interviews focusing on 'tell me about yourself'."],
                },
              },
            ],
          },
        },
      ],
    });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    const result = await client.interviewRubricEval({
      transcript: "Candidate explained their project experience.",
      rubric: [
        {
          id: "communication",
          title: "Communication",
          description: "Evaluate clarity and structure.",
        },
      ],
    });

    expect(result).toEqual({
      overallScore: 42,
      summary:
        "Fluency evaluation completed. Rating: EMERGING. Some hesitations; noticeable filler words; occasional run-on phrases. Strengths: Clear identification of name and current role; Direct articulation of motivation tied to the role. Areas for improvement: Reduce filler words.; Break complex ideas into shorter sentences.",
      criteria: [
        {
          criterionId: "crit-fluency",
          score: 42,
          evidence:
            "Introduction and role are stated clearly.\nThere are filler words and hesitations.\nTranscript excerpt: I want to be, I want to gain more money.\nImproved response example: Hi, I'm Leandro. I'm a software developer currently working at a bank.",
          notes:
            "Some hesitations; noticeable filler words; occasional run-on phrases | Fluency: EMERGING | Weight: 33 | Strengths: Clear identification of name and current role; Direct articulation of motivation tied to the role | Next steps: Schedule mock interviews focusing on 'tell me about yourself'.",
          actionItems: [
            "Reduce filler words.",
            "Break complex ideas into shorter sentences.",
            "Record a 2-minute practice version and review for filler words.",
          ],
        },
      ],
    });
  });

  it("transforms score_report style responses into the expected domain format", async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              {
                type: "output_json",
                json: {
                  score_report: {
                    criterion_id: "crit-fluency",
                    criterion_title: "Fluency",
                    weight: 33,
                    score: 66,
                    score_label: "PROFICIENT",
                    description: "Maintain flow during interviews (speaking)",
                    evidence: {
                      observations: [
                        "No obvious long pauses or hesitations detected in the transcript.",
                        "Overall flow is steady with ideas connected logically.",
                      ],
                      transcript_examples: ["Official phrasing choices are slightly awkward."],
                    },
                    analysis: {
                      strengths: [
                        "Clear self-introduction and statement of current role.",
                        "Maintains a coherent narrative about career goals.",
                      ],
                      areas_for_improvement: [
                        "Polish phrasing to sound more natural and professional.",
                        "Reduce repetitive structures and minor grammatical errors.",
                      ],
                    },
                    recommendations: [
                      "Prepare a concise 60-second intro with natural-sounding sentences.",
                    ],
                    sample_improved_script:
                      "Hi, my name is Leandro. I’m a software developer at Bensu in Brazil.",
                    next_steps: [
                      "Practice the improved script aloud and adapt it to different prompts.",
                    ],
                    impact_estimate: {
                      short_term: "Moderate improvement in perceived fluency and professionalism.",
                      long_term:
                        "Better overall communication during interviews, with more natural delivery.",
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    const result = await client.interviewRubricEval({
      transcript: "Candidate explained their project experience.",
      rubric: [
        {
          id: "communication",
          title: "Communication",
          description: "Evaluate clarity and structure.",
        },
      ],
    });

    expect(result).toEqual({
      overallScore: 66,
      summary:
        "Fluency evaluation completed. Rating: PROFICIENT. Maintain flow during interviews (speaking). Strengths: Clear self-introduction and statement of current role.; Maintains a coherent narrative about career goals. Areas for improvement: Polish phrasing to sound more natural and professional.; Reduce repetitive structures and minor grammatical errors. Recommendations: Prepare a concise 60-second intro with natural-sounding sentences.",
      criteria: [
        {
          criterionId: "crit-fluency",
          score: 66,
          evidence:
            "No obvious long pauses or hesitations detected in the transcript.\nOverall flow is steady with ideas connected logically.\nTranscript example: Official phrasing choices are slightly awkward.\nSample improved script: Hi, my name is Leandro. I’m a software developer at Bensu in Brazil.",
          notes:
            "Fluency: PROFICIENT | Maintain flow during interviews (speaking) | Weight: 33 | Strengths: Clear self-introduction and statement of current role.; Maintains a coherent narrative about career goals. | Next steps: Practice the improved script aloud and adapt it to different prompts. | Impact: Short term: Moderate improvement in perceived fluency and professionalism.; Long term: Better overall communication during interviews, with more natural delivery.",
          actionItems: [
            "Polish phrasing to sound more natural and professional.",
            "Reduce repetitive structures and minor grammatical errors.",
            "Prepare a concise 60-second intro with natural-sounding sentences.",
            "Practice the improved script aloud and adapt it to different prompts.",
          ],
        },
      ],
    });
  });

  it("keeps legacy schema-compatible responses intact", async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              {
                type: "output_json",
                json: {
                  overall_score: "0.75",
                  summary: "Strong collaboration evidence.",
                  criteria: [
                    {
                      criterion_id: "communication",
                      score: "1",
                      evidence: "Clear and concise explanations.",
                      action_items: ["Continue using STAR method"],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    const result = await client.interviewRubricEval({
      transcript: "Candidate explained their project experience.",
      rubric: [
        {
          id: "communication",
          title: "Communication",
          description: "Evaluate clarity and structure.",
        },
      ],
    });

    expect(result).toEqual({
      overallScore: 0.75,
      summary: "Strong collaboration evidence.",
      criteria: [
        {
          criterionId: "communication",
          score: 1,
          evidence: "Clear and concise explanations.",
          actionItems: ["Continue using STAR method"],
        },
      ],
    });
  });

  it("propagates invalid_response errors when OpenAI returns empty content", async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: "",
          },
        },
      ],
    });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    await expect(
      client.interviewRubricEval({
        transcript: "Transcript",
        rubric: [{ id: "crit", title: "Criterion", description: "desc" }],
      }),
    ).rejects.toMatchObject({
      code: "invalid_response",
      details: expect.objectContaining({ attempts: 3 }),
    });
    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);
  });

  it("retries empty responses before succeeding", async () => {
    createChatCompletionMock
      .mockResolvedValueOnce({
        id: "empty-1",
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: "",
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "empty-2",
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: "",
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "success-1",
        choices: [
          {
            message: {
              content: [
                {
                  type: "output_json",
                  json: {
                    overall_score: 0.8,
                    summary: "Completed.",
                    criteria: [
                      {
                        criterion_id: "communication",
                        score: 0.9,
                        evidence: "Detail.",
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

    const client = createOpenAiLLMClient({
      apiKey: "fake-key",
      model: "test-model",
    });

    const result = await client.interviewRubricEval({
      transcript: "Transcript",
      rubric: [{ id: "communication", title: "Communication", description: "desc" }],
    });

    expect(result).toEqual({
      overallScore: 0.8,
      summary: "Completed.",
      criteria: [
        {
          criterionId: "communication",
          score: 0.9,
          evidence: "Detail.",
        },
      ],
    });
    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);
  });
});
