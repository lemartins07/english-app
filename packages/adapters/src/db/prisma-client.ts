import type { Prisma } from "@prisma/client";
import { createRequire } from "node:module";

type PrismaClient = import("@prisma/client").PrismaClient;
type PrismaClientConstructor = new (
  ...args: ConstructorParameters<typeof import("@prisma/client").PrismaClient>
) => PrismaClient;

const requireFromRoot = createRequire(new URL("../../../../package.json", import.meta.url));

let PrismaClientCtor: PrismaClientConstructor | undefined;

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
  if (!PrismaClientCtor) {
    const clientModule = requireFromRoot("@prisma/client") as typeof import("@prisma/client");
    PrismaClientCtor = clientModule.PrismaClient;
  }

  const PrismaClientConstructor = PrismaClientCtor;
  if (!PrismaClientConstructor) {
    throw new Error("Failed to load Prisma client constructor.");
  }

  const logLevels: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? ["error", "warn"]
      : ["error"];

  return new PrismaClientConstructor({ log: logLevels });
}

export function getPrismaClient(): PrismaClient {
  ensureDatabaseUrl();

  if (!globalThis.__englishAppPrisma) {
    globalThis.__englishAppPrisma = createPrismaClient();
  }

  return globalThis.__englishAppPrisma;
}

export type DatabaseClient = PrismaClient;
