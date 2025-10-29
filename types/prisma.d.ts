declare module "@prisma/client" {
  export type PrismaLogLevel = "query" | "info" | "warn" | "error";

  export namespace Prisma {
    export type LogLevel = PrismaLogLevel;
  }

  export type Role = "USER" | "ADMIN";

  export interface User {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    role: Role;
    level: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface PrismaClientOptions {
    log?: PrismaLogLevel[];
  }

  export interface UserDelegate {
    findUnique(args: unknown): Promise<User | null>;
    upsert(args: unknown): Promise<User>;
  }

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    user: UserDelegate;
    $queryRaw<T = unknown>(query: TemplateStringsArray | string, ...values: unknown[]): Promise<T>;
  }
}
