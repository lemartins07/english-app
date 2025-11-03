import type { Logger } from "@english-app/observability";

import type { UseCase } from "../../index";
import type { UserRepository } from "../../repositories/user-repository";

export interface CompletePlacementTestInput {
  userId: string;
}

export interface CompletePlacementTestResult {
  userId: string;
  hasCompletedPlacementTest: boolean;
}

interface CompletePlacementTestDependencies {
  users: UserRepository;
  logger?: Logger;
}

export class CompletePlacementTestUseCase
  implements UseCase<CompletePlacementTestInput, CompletePlacementTestResult>
{
  private readonly users: UserRepository;
  private readonly logger?: Logger;

  constructor(dependencies: CompletePlacementTestDependencies) {
    this.users = dependencies.users;
    this.logger = dependencies.logger;
  }

  async execute(input: CompletePlacementTestInput): Promise<CompletePlacementTestResult> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      this.logger?.warn?.("Attempted to complete placement test for missing user", {
        userId: input.userId,
      });
      throw new Error("User not found");
    }

    if (user.hasCompletedPlacementTest) {
      return {
        userId: user.id,
        hasCompletedPlacementTest: true,
      };
    }

    const updated = await this.users.save({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      level: user.level,
      role: user.role,
      hasCompletedPlacementTest: true,
    });

    return {
      userId: updated.id,
      hasCompletedPlacementTest: Boolean(updated.hasCompletedPlacementTest),
    };
  }
}
