import { describe, expect, it } from "vitest";

import type { UserEntity } from "@english-app/domain";

import type { SaveUserInput, UserRepository } from "../../../repositories/user-repository";
import { CompletePlacementTestUseCase } from "../complete-placement-test";

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserEntity>();

  constructor(initialUsers: UserEntity[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(input: SaveUserInput): Promise<UserEntity> {
    const existing = input.id ? this.users.get(input.id) : null;
    const entity: UserEntity = {
      id: input.id ?? existing?.id ?? `user-${this.users.size + 1}`,
      email: input.email,
      role: input.role ?? existing?.role ?? "USER",
      displayName: input.displayName ?? existing?.displayName,
      level: input.level ?? existing?.level,
      hasCompletedPlacementTest:
        input.hasCompletedPlacementTest ?? existing?.hasCompletedPlacementTest ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(entity.id, entity);
    return entity;
  }
}

describe("CompletePlacementTestUseCase", () => {
  const baseUser: UserEntity = {
    id: "user-1",
    email: "user@example.com",
    role: "USER",
    displayName: "User",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("marks the placement test as completed for an existing user", async () => {
    const repository = new InMemoryUserRepository([baseUser]);
    const useCase = new CompletePlacementTestUseCase({ users: repository });

    const result = await useCase.execute({ userId: baseUser.id });

    expect(result).toEqual({
      userId: baseUser.id,
      hasCompletedPlacementTest: true,
    });

    const stored = await repository.findById(baseUser.id);
    expect(stored?.hasCompletedPlacementTest).toBe(true);
  });

  it("is idempotent when the user already completed the test", async () => {
    const user: UserEntity = {
      ...baseUser,
      hasCompletedPlacementTest: true,
    };
    const repository = new InMemoryUserRepository([user]);
    const useCase = new CompletePlacementTestUseCase({ users: repository });

    const result = await useCase.execute({ userId: user.id });

    expect(result).toEqual({
      userId: user.id,
      hasCompletedPlacementTest: true,
    });
  });

  it("throws when the user cannot be found", async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new CompletePlacementTestUseCase({ users: repository });

    await expect(useCase.execute({ userId: "missing-user" })).rejects.toThrowError(
      "User not found",
    );
  });
});
