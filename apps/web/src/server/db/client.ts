import { getPrismaClient } from "@english-app/adapters";

let prismaSingleton: ReturnType<typeof getPrismaClient> | undefined;

export function getPrisma() {
  if (!prismaSingleton) {
    prismaSingleton = getPrismaClient();
  }

  return prismaSingleton;
}
