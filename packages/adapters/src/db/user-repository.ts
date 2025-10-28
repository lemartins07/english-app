import type { PrismaClient, Role, User } from "@prisma/client/index";

import type { SaveUserInput, UserRepository } from "@english-app/application";
import type { UserEntity, UserRole } from "@english-app/domain";

import { getPrismaClient } from "./prisma-client";

function toUserEntity(record: User & { role: Role }): UserEntity {
  if (!record.email) {
    throw new Error("Persisted user is missing an email. This indicates data corruption.");
  }

  const role = (record.role as UserRole) ?? "USER";

  return {
    id: record.id,
    email: record.email,
    role,
    displayName: record.name ?? undefined,
    level: (record as { level?: string | null }).level ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaUserRepository implements UserRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      return null;
    }

    return toUserEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    return toUserEntity(user);
  }

  async save(user: SaveUserInput): Promise<UserEntity> {
    const { email, displayName, level, role, id } = user;
    const saved = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: displayName,
        level: level ?? null,
        role: role ?? "USER",
        ...(id ? { id } : {}),
      },
      update: {
        name: displayName,
        level: level ?? null,
        role: role ?? "USER",
      },
    });

    return toUserEntity(saved);
  }
}
