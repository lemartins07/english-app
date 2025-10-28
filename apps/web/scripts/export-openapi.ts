import { config as loadDotenv } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const projectDir = resolve(process.cwd(), "apps/web");
  loadDotenv({ path: resolve(projectDir, ".env.local") });
  loadDotenv({ path: resolve(projectDir, ".env") });
  loadDotenv({ path: resolve(process.cwd(), ".env.local") });
  loadDotenv({ path: resolve(process.cwd(), ".env") });

  const { generateOpenAPIDocument } = await import("../src/server/openapi/document");
  const outDir = resolve(process.cwd(), "apps/web/.openapi");
  const outFile = resolve(outDir, "openapi.json");
  const document = generateOpenAPIDocument();

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outFile}`);
}

void main();
