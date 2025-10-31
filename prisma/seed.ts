/* eslint-env node */

import type {
  AssessmentQuestionType,
  AssessmentSessionStatus,
  AssessmentType,
  CEFRLevel,
} from "@prisma/client";

import { getPrismaClient, PrismaUserRepository } from "@english-app/adapters";

const SEED_USER_EMAIL = "user@example.com";
const LEVELING_SESSION_ID = "seed-leveling-session";

async function upsertSeedUser() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);

  return users.save({
    email: SEED_USER_EMAIL,
    displayName: "English App User",
    role: "USER",
  });
}

type SeedAnswerInput = {
  questionId: string;
  questionType: AssessmentQuestionType;
  content: Record<string, unknown>;
  evaluation?: Record<string, unknown>;
  score?: string;
  maxScore?: string;
  durationSec?: number;
};

async function upsertAssessmentSession(userId: string) {
  const prisma = getPrismaClient();
  const startedAt = new Date();
  startedAt.setUTCMinutes(startedAt.getUTCMinutes() - 12);

  const completedAt = new Date();
  completedAt.setUTCMinutes(completedAt.getUTCMinutes() - 2);

  return prisma.assessmentSession.upsert({
    where: { id: LEVELING_SESSION_ID },
    create: {
      id: LEVELING_SESSION_ID,
      userId,
      type: "LEVELING" satisfies AssessmentType,
      status: "COMPLETED" satisfies AssessmentSessionStatus,
      startedAt,
      completedAt,
      metadata: {
        objective: "Entrevista backend",
        goalLevel: "C1",
      },
    },
    update: {
      userId,
      status: "COMPLETED" satisfies AssessmentSessionStatus,
      completedAt,
      metadata: {
        objective: "Entrevista backend",
        goalLevel: "C1",
      },
    },
  });
}

async function upsertAssessmentAnswers(sessionId: string, answers: SeedAnswerInput[]) {
  const prisma = getPrismaClient();

  await Promise.all(
    answers.map((answer) =>
      prisma.assessmentAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: answer.questionId,
          },
        },
        create: {
          sessionId,
          questionId: answer.questionId,
          questionType: answer.questionType,
          content: answer.content,
          evaluation: answer.evaluation,
          score: answer.score,
          maxScore: answer.maxScore,
          durationSec: answer.durationSec,
        },
        update: {
          content: answer.content,
          evaluation: answer.evaluation,
          score: answer.score,
          maxScore: answer.maxScore,
          durationSec: answer.durationSec,
        },
      }),
    ),
  );
}

async function upsertAssessmentResult(sessionId: string) {
  const prisma = getPrismaClient();

  await prisma.assessmentResult.upsert({
    where: { sessionId },
    create: {
      sessionId,
      level: "B2" satisfies CEFRLevel,
      overallScore: "73.5",
      skillScores: {
        reading: 80,
        listening: 76,
        speaking: 68,
      },
      strengths: ["Vocabulary range", "Problem-solving explanations"],
      areasToImprove: ["Connected speech", "Past tense accuracy"],
      recommendations: [
        "Refine grammar for behavioral questions",
        "Practice timed speaking drills twice a week",
      ],
      summary:
        "Boa performance geral com oportunidade de trabalhar consistência nos tempos verbais durante entrevistas.",
    },
    update: {
      level: "B2" satisfies CEFRLevel,
      overallScore: "73.5",
      skillScores: {
        reading: 80,
        listening: 76,
        speaking: 68,
      },
      strengths: ["Vocabulary range", "Problem-solving explanations"],
      areasToImprove: ["Connected speech", "Past tense accuracy"],
      recommendations: [
        "Refine grammar for behavioral questions",
        "Practice timed speaking drills twice a week",
      ],
      summary:
        "Boa performance geral com oportunidade de trabalhar consistência nos tempos verbais durante entrevistas.",
    },
  });
}

async function seedAssessmentData(userId: string) {
  const session = await upsertAssessmentSession(userId);

  const answers: SeedAnswerInput[] = [
    {
      questionId: "mcq-architecture-patterns",
      questionType: "MCQ",
      content: {
        selectedOption: "hexagonal",
        choices: ["mvc", "hexagonal", "layered", "event-driven"],
      },
      evaluation: {
        correctOption: "hexagonal",
        rationale: "Pattern mais alinhado ao cenário descrito com isolamento de domínios.",
      },
      score: "1.00",
      maxScore: "1.00",
    },
    {
      questionId: "listening-sre-incident",
      questionType: "LISTENING",
      content: {
        transcript:
          "I escalated the incident to the SRE team after noticing the latency spike at 03:15 UTC.",
        keywordHits: ["escalated", "latency spike"],
      },
      evaluation: {
        comprehension: 0.78,
        missingDetails: ["impact on users"],
      },
      score: "0.78",
      maxScore: "1.00",
      durationSec: 65,
    },
    {
      questionId: "speaking-star-story",
      questionType: "SPEAKING",
      content: {
        audioUri: "s3://english-app/seeds/speaking-short.m4a",
        durationSec: 54,
      },
      evaluation: {
        transcript:
          "I faced a production outage due to a deployment misconfiguration, coordinated a rollback, and added automated checks.",
        fluency: 0.68,
        grammar: 0.72,
      },
      score: "0.70",
      maxScore: "1.00",
      durationSec: 54,
    },
  ];

  await upsertAssessmentAnswers(session.id, answers);
  await upsertAssessmentResult(session.id);
}

async function main() {
  const user = await upsertSeedUser();
  await seedAssessmentData(user.id);
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info("✅ Database seeding completed");
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("❌ Database seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
