import { beforeEach, describe, expect, it, vi } from "vitest";

type GuardHandler = (...args: unknown[]) => Response | Promise<Response>;

const mocks = vi.hoisted(() => {
  const mockGetCurrentUser = vi.fn();
  const mockWithAuthGuard = vi.fn(
    (handler: GuardHandler) =>
      async (...args: unknown[]): Promise<Response> => {
        const result = handler(...args);
        return result instanceof Promise ? await result : result;
      },
  );
  const mockGetPrisma = vi.fn();
  const mockExecute = vi.fn();
  const mockUseCaseConstructor = vi.fn(function CompletePlacementTestUseCaseMock() {
    return { execute: mockExecute };
  });
  const repositoryFactory: { current: (...args: unknown[]) => Record<string, unknown> } = {
    current: () => ({}),
  };
  const mockRepositoryConstructor = vi.fn(function PrismaUserRepositoryMock(...args: unknown[]) {
    return repositoryFactory.current(...args);
  });
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  return {
    mockGetCurrentUser,
    mockWithAuthGuard,
    mockGetPrisma,
    mockExecute,
    mockUseCaseConstructor,
    mockRepositoryConstructor,
    repositoryFactory,
    mockLogger,
  };
});

vi.mock("@/server/auth", () => ({
  getCurrentUser: mocks.mockGetCurrentUser,
  withAuthGuard: mocks.mockWithAuthGuard,
}));

vi.mock("@/server/db/client", () => ({
  getPrisma: mocks.mockGetPrisma,
}));

vi.mock("@english-app/application", () => ({
  CompletePlacementTestUseCase: mocks.mockUseCaseConstructor,
}));

vi.mock("@english-app/adapters/db", () => ({
  PrismaUserRepository: mocks.mockRepositoryConstructor,
}));

vi.mock("@english-app/observability", () => ({
  getObservabilityContext: () => ({ logger: mocks.mockLogger }),
}));

// Import the actual route handlers
import { POST } from "../placement-test/complete/route";
import { GET } from "../placement-test-status/route";

describe("Placement Test API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repositoryFactory.current = () => ({});
  });

  describe("GET /api/user/placement-test-status", () => {
    it("should return 401 if unauthenticated", async () => {
      mocks.mockGetCurrentUser.mockResolvedValueOnce(null);
      const response = await GET();
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("UNAUTHORIZED");
    });

    it("should return hasCompletedPlacementTest: false for a new user", async () => {
      mocks.mockGetCurrentUser.mockResolvedValueOnce({
        id: "user123",
        hasCompletedPlacementTest: false,
      });
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.hasCompletedPlacementTest).toBe(false);
    });

    it("should return hasCompletedPlacementTest: true after completing the test", async () => {
      mocks.mockGetCurrentUser.mockResolvedValueOnce({
        id: "user123",
        hasCompletedPlacementTest: true,
      });
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.hasCompletedPlacementTest).toBe(true);
    });
  });

  describe("POST /api/user/placement-test/complete", () => {
    it("should return 401 if unauthenticated", async () => {
      mocks.mockGetCurrentUser.mockResolvedValueOnce(null);
      const response = await POST();
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("UNAUTHORIZED");
    });

    it("should update hasCompletedPlacementTest to true for the authenticated user", async () => {
      const userId = "user123";
      mocks.mockGetCurrentUser.mockResolvedValueOnce({
        id: userId,
        hasCompletedPlacementTest: false,
      });
      mocks.mockExecute.mockResolvedValueOnce({ userId, hasCompletedPlacementTest: true });
      const prismaInstance = Symbol("prisma");
      const repositoryInstance = {};
      mocks.mockGetPrisma.mockReturnValueOnce(prismaInstance);
      mocks.repositoryFactory.current = () => repositoryInstance;

      const response = await POST();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.hasCompletedPlacementTest).toBe(true);
      expect(mocks.mockRepositoryConstructor).toHaveBeenCalledWith(prismaInstance);
      expect(mocks.mockUseCaseConstructor).toHaveBeenCalledWith({
        users: repositoryInstance,
        logger: mocks.mockLogger,
      });
      expect(mocks.mockExecute).toHaveBeenCalledWith({ userId });
    });

    it("should return 500 if the database update fails", async () => {
      const userId = "user123";
      mocks.mockGetCurrentUser.mockResolvedValueOnce({
        id: userId,
        hasCompletedPlacementTest: false,
      });
      mocks.mockExecute.mockRejectedValueOnce(new Error("DB Error"));
      mocks.mockGetPrisma.mockReturnValueOnce(Symbol("prisma"));
      mocks.repositoryFactory.current = () => ({});

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const response = await POST();
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("INTERNAL_SERVER_ERROR");

      consoleErrorSpy.mockRestore();
    });
  });
});
