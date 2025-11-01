import type {
  AssessmentDiagnostic,
  AssessmentResponse,
  AssessmentSession,
} from "@english-app/domain";

export interface StoredAssessmentSession {
  session: {
    id: AssessmentSession["id"];
    userId: AssessmentSession["userId"];
    blueprintId: AssessmentSession["blueprintId"];
    status: AssessmentSession["status"];
    targetLevel?: AssessmentSession["targetLevel"];
    startedAt: AssessmentSession["startedAt"];
    completedAt?: AssessmentSession["completedAt"];
    createdAt: AssessmentSession["createdAt"];
    updatedAt: AssessmentSession["updatedAt"];
  };
  responses: AssessmentResponse[];
  diagnostic?: AssessmentDiagnostic;
}

export interface CreateAssessmentSessionInput {
  session: AssessmentSession;
}

export interface AssessmentSessionRepository {
  findById(sessionId: string): Promise<StoredAssessmentSession | null>;
  findActiveByUser(userId: string): Promise<StoredAssessmentSession | null>;
  create(input: CreateAssessmentSessionInput): Promise<void>;
  appendResponse(sessionId: string, response: AssessmentResponse): Promise<void>;
  updateStatus(
    sessionId: string,
    status: AssessmentSession["status"],
    metadata?: {
      completedAt?: AssessmentSession["completedAt"];
      targetLevel?: AssessmentSession["targetLevel"];
    },
  ): Promise<void>;
  saveDiagnostic(sessionId: string, diagnostic: AssessmentDiagnostic): Promise<void>;
}
