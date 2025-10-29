import { config as loadDotenv } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const projectDir = resolve(process.cwd(), "apps/web");
  loadDotenv({ path: resolve(projectDir, ".env.local") });
  loadDotenv({ path: resolve(projectDir, ".env") });
  loadDotenv({ path: resolve(process.cwd(), ".env.local") });
  loadDotenv({ path: resolve(process.cwd(), ".env") });

  const fallbackEnv = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/english_app",
    AUTH_SECRET: "development-secret",
    GOOGLE_CLIENT_ID: "stub-google-client-id",
    GOOGLE_CLIENT_SECRET: "stub-google-client-secret",
    EMAIL_FROM: "english-app@example.com",
  } as const;

  for (const [key, value] of Object.entries(fallbackEnv)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  const { generateOpenAPIDocument } = await import("../src/server/openapi/document");
  const outDir = resolve(process.cwd(), "apps/web/.openapi");
  const outFile = resolve(outDir, "openapi.json");
  const document = generateOpenAPIDocument();

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outFile}`);
}

void main();
