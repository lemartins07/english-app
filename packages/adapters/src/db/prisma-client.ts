import type { Prisma } from "@prisma/client/index";
import { createRequire } from "node:module";

const requireFromRoot = createRequire(new URL("../../../../package.json", import.meta.url));
const { PrismaClient: PrismaClientCtor } = requireFromRoot(
  "@prisma/client",
) as typeof import("@prisma/client");

type PrismaClient = import("@prisma/client/index").PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __englishAppPrisma: PrismaClient | undefined;
}

function ensureDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not configured");
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol");
  }
}

function createPrismaClient(): PrismaClient {
  const logLevels: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? ["error", "warn"]
      : ["error"];

  return new PrismaClientCtor({ log: logLevels });
}

export function getPrismaClient(): PrismaClient {
  ensureDatabaseUrl();

  if (!globalThis.__englishAppPrisma) {
    globalThis.__englishAppPrisma = createPrismaClient();
  }

  return globalThis.__englishAppPrisma;
}

export type DatabaseClient = PrismaClient;
