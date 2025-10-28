/* eslint-env node */

import { getPrismaClient, PrismaUserRepository } from "@english-app/adapters";

async function main() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);

  await users.save({
    email: "user@example.com",
    displayName: "English App User",
    role: "USER",
  });
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
